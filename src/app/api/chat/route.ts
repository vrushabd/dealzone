import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ 
                error: "AI Not Configured. Missing GEMINI_API_KEY." 
            }, { status: 501 });
        }

        const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
        
        // Keyword extraction for DB search
        const keywords = lastUserMessage.toLowerCase().split(' ').filter((w: string) => 
            w.length > 3 && !['what', 'this', 'that', 'with', 'under', 'over', 'find', 'show', 'suggest', 'looking', 'best', 'good'].includes(w)
        );

        // Fetch matching products from DB
        let contextProducts: any[] = [];
        if (keywords.length > 0) {
            contextProducts = await prisma.product.findMany({
                where: {
                    OR: keywords.map((k: string) => ({ title: { contains: k, mode: 'insensitive' as any } })),
                    isPublic: true
                },
                take: 5,
                select: { title: true, slug: true, price: true, category: { select: { name: true } } }
            });
        }

        if (contextProducts.length === 0) {
            contextProducts = await prisma.product.findMany({
                where: { featured: true, isPublic: true },
                take: 5,
                select: { title: true, slug: true, price: true, category: { select: { name: true } } }
            });
        }

        const dbContext = contextProducts.length > 0
            ? `Available products:\n` + contextProducts.map((p: any) =>
                `- ${p.title} (${p.category?.name || 'General'}): ₹${p.price || 'N/A'} → /products/${p.slug}`
            ).join('\n')
            : "No specific products found.";

        const systemPrompt = `You are the DealZone AI Shopping Assistant. Help users find products, compare prices, and give buying advice based ONLY on products in the DealZone database. Be concise and friendly. Use markdown.\n\n${dbContext}\n\nOnly recommend products above. If not found, say DealZone doesn't track it yet. Do NOT invent prices.`;

        // Build conversation for Gemini API
        const conversationHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Use the REST API directly to avoid SDK model compatibility issues
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
                    generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
                })
            }
        );

        if (!geminiRes.ok) {
            const errBody = await geminiRes.text();
            console.error("Gemini API error:", geminiRes.status, errBody);
            return NextResponse.json({ error: `AI API error: ${geminiRes.status}` }, { status: 500 });
        }

        const geminiData = await geminiRes.json();
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

        return NextResponse.json({ message: responseText });

    } catch (error) {
        console.error("Chat route error:", error);
        return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
    }
}
