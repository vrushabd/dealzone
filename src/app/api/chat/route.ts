import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

type ChatMessage = { role: 'user' | 'assistant' | 'system' | 'model'; content: string };

// Basic in-memory rate limiting to protect the upstream AI API.
// This is per-server-instance (works well enough for small deployments).
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX_REQUESTS = 12;
const rateBucket = new Map<string, number[]>();

// Prefer currently supported models first.
// Keep GEMINI_MODEL as a *last* fallback because envs often point to deprecated names.
const GEMINI_MODELS = Array.from(
    new Set(
        [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            process.env.GEMINI_MODEL,
        ].filter(Boolean)
    )
) as string[];

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getClientKey(req: NextRequest) {
    const fwd = req.headers.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0]?.trim();
    return ip || req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string) {
    const now = Date.now();
    const windowStart = now - RATE_WINDOW_MS;
    const arr = rateBucket.get(key) || [];
    const recent = arr.filter((t) => t >= windowStart);
    recent.push(now);
    rateBucket.set(key, recent);
    return recent.length > RATE_MAX_REQUESTS;
}

function extractUpstreamMessage(bodyText: string): string | null {
    try {
        const parsed = JSON.parse(bodyText);
        const msg = parsed?.error?.message || parsed?.message;
        return typeof msg === "string" ? msg : null;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const clientKey = getClientKey(req);
        if (isRateLimited(clientKey)) {
            return NextResponse.json(
                { error: "Too many chat requests. Please wait a minute and try again." },
                { status: 429 }
            );
        }

        const { messages } = (await req.json()) as { messages?: ChatMessage[] };
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ 
                error: "AI Not Configured. Missing GEMINI_API_KEY." 
            }, { status: 501 });
        }

        const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
        
        // Keyword extraction for DB search
        const keywords = lastUserMessage.toLowerCase().split(' ').filter((w: string) => 
            w.length > 3 && !['what', 'this', 'that', 'with', 'under', 'over', 'find', 'show', 'suggest', 'looking', 'best', 'good'].includes(w)
        );

        // Fetch matching products from DB
        let contextProducts: Array<{
            id: string;
            title: string;
            slug: string;
            image: string | null;
            price: number | null;
            originalPrice: number | null;
            amazonLink: string | null;
            flipkartLink: string | null;
            category: { name: string } | null;
        }> = [];
        if (keywords.length > 0) {
            contextProducts = await prisma.product.findMany({
                where: {
                    OR: keywords.map((k: string) => ({ title: { contains: k, mode: 'insensitive' as any } })),
                    isPublic: true
                },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    image: true,
                    price: true,
                    originalPrice: true,
                    amazonLink: true,
                    flipkartLink: true,
                    category: { select: { name: true } },
                }
            });
        }

        if (contextProducts.length === 0) {
            contextProducts = await prisma.product.findMany({
                where: { featured: true, isPublic: true },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    image: true,
                    price: true,
                    originalPrice: true,
                    amazonLink: true,
                    flipkartLink: true,
                    category: { select: { name: true } },
                }
            });
        }

        const dbContext = contextProducts.length > 0
            ? `Available products:\n` + contextProducts.map((p: any) =>
                `- ${p.title} (${p.category?.name || 'General'}): ₹${p.price || 'N/A'} → /products/${p.slug}`
            ).join('\n')
            : "No specific products found.";

        const systemPrompt = `You are the DealZone AI Shopping Assistant. Help users find products, compare prices, and give buying advice based ONLY on products in the DealZone database. Be concise and friendly. Use markdown.\n\n${dbContext}\n\nOnly recommend products above. If not found, say DealZone doesn't track it yet. Do NOT invent prices.`;

        // Build conversation for Gemini API
        const conversationHistory = messages.slice(0, -1).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Try configured model first, then known-safe fallbacks.
        // This avoids hard-failing when Google deprecates/renames a model.
        let responseText = "";
        let lastError: { status: number; body: string; model: string } | null = null;

        for (const model of GEMINI_MODELS) {
            // Retry a bit on transient upstream overloads/rate limits.
            // (If quota is exhausted, the retries will still fail, but user gets a clearer 429.)
            const maxAttempts = 3;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [
                                { role: 'user', parts: [{ text: systemPrompt }] },
                                { role: 'model', parts: [{ text: 'Understood. I am the DealZone shopping assistant.' }] },
                                ...conversationHistory,
                                { role: 'user', parts: [{ text: lastUserMessage }] }
                            ],
                            generationConfig: { maxOutputTokens: 450, temperature: 0.7 }
                        })
                    }
                );

                if (!geminiRes.ok) {
                    const errBody = await geminiRes.text();
                    lastError = { status: geminiRes.status, body: errBody, model };

                    // If model is missing/invalid, try the next fallback model.
                    if (geminiRes.status === 404 || geminiRes.status === 400) break;

                    // Upstream rate limit / overload: backoff + retry.
                    if (geminiRes.status === 429 || geminiRes.status === 503) {
                        const backoff = 350 * Math.pow(2, attempt - 1);
                        await sleep(backoff);
                        continue;
                    }

                    console.error("Gemini API error:", geminiRes.status, errBody);
                    const upstreamMsg = extractUpstreamMessage(errBody);
                    return NextResponse.json(
                        { error: upstreamMsg ? `AI error: ${upstreamMsg}` : `AI API error: ${geminiRes.status}` },
                        { status: 500 }
                    );
                }

                const geminiData = await geminiRes.json();
                responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (responseText) break;
            }

            if (responseText) break;
        }

        if (!responseText) {
            if (lastError) {
                console.error("Gemini model fallback exhausted:", lastError);
                const upstreamMsg = extractUpstreamMessage(lastError.body);
                if (lastError.status === 429) {
                    return NextResponse.json(
                        {
                            error: upstreamMsg
                                ? `AI is rate-limited: ${upstreamMsg}`
                                : "AI is rate-limited right now. Please try again in a minute.",
                        },
                        { status: 429 }
                    );
                }
                return NextResponse.json(
                    { error: upstreamMsg ? `AI error: ${upstreamMsg}` : `AI API error: ${lastError.status}` },
                    { status: 500 }
                );
            }
            responseText = "I'm sorry, I couldn't generate a response.";
        }

        return NextResponse.json({
            message: responseText,
            products: contextProducts.map((p) => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                image: p.image,
                price: p.price,
                originalPrice: p.originalPrice,
                category: p.category?.name || null,
                amazonLink: p.amazonLink,
                flipkartLink: p.flipkartLink,
                href: `/products/${p.slug}`,
            })),
        });

    } catch (error) {
        console.error("Chat route error:", error);
        return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
    }
}
