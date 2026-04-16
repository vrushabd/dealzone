import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ 
                error: "AI Not Configured. Missing GEMINI_API_KEY in environment variables." 
            }, { status: 501 });
        }

        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
        
        // Very basic semantic extraction (keywords)
        const keywords = lastUserMessage.toLowerCase().split(' ').filter((w: string) => 
            w.length > 3 && !['what', 'this', 'that', 'with', 'under', 'over', 'find', 'show', 'suggest', 'looking'].includes(w)
        );

        // Fetch context from the database
        let contextProducts: any[] = [];
        if (keywords.length > 0) {
            const orConditions = keywords.map((k: string) => ({
                title: { contains: k, mode: 'insensitive' as any }
            }));
            
            contextProducts = await prisma.product.findMany({
                where: {
                    OR: orConditions,
                    isPublic: true
                },
                take: 5,
                select: {
                    title: true,
                    slug: true,
                    price: true,
                    amazonLink: true,
                    flipkartLink: true,
                    category: { select: { name: true } }
                }
            });
        } else {
            // Fallback: top featured deals
            contextProducts = await prisma.product.findMany({
                where: { featured: true, isPublic: true },
                take: 5,
                select: {
                    title: true,
                    slug: true,
                    price: true,
                    amazonLink: true,
                    flipkartLink: true,
                    category: { select: { name: true } }
                }
            });
        }

        // Format context
        const dbContext = contextProducts.length > 0
            ? `Available products in database:\n` + contextProducts.map(p => 
                `- ${p.title} (${p.category?.name || 'Uncategorised'}): ₹${p.price || 'N/A'}. Link: /products/${p.slug}`
            ).join('\n')
            : "No specific products found matching the query in the database.";

        const systemPrompt = `You are the DealZone AI Shopping Assistant (similar to BuyHatke). 
Your goal is to help users find products, track prices, and give buying advice based ONLY on the products available in the DealZone database.
Be concise, friendly, and use markdown formatting. 

${dbContext}

If the user asks for a product in the database, recommend it strongly and provide the relative link (e.g., [Product Name](/products/slug)).
If the user asks for a product NOT in the database, apologize and say DealZone doesn't track it yet, but they can request it to be added.
Do NOT invent products or prices.`;

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash" });

        // Format conversation history for Gemini
        const chatHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: "System prompt: " + systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. I am the DealZone assistant." }] },
                ...chatHistory,
            ]
        });

        const result = await chat.sendMessage(lastUserMessage);
        const responseText = result.response.text();

        return NextResponse.json({ message: responseText });

    } catch (error) {
        console.error("AI Chat Error:", error);
        return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
    }
}
