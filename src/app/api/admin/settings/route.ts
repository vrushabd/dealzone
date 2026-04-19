import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
        return NextResponse.json({ 
            defaultTheme: settings?.defaultTheme || "dark",
            geminiApiKey: settings?.geminiApiKey || ""
        });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { defaultTheme, geminiApiKey } = await req.json();

        const updateData: { defaultTheme?: string; geminiApiKey?: string } = {};

        if (defaultTheme) {
            if (!["light", "dark"].includes(defaultTheme)) {
                return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
            }
            updateData.defaultTheme = defaultTheme;
        }

        if (geminiApiKey !== undefined) {
            updateData.geminiApiKey = geminiApiKey;
        }

        const settings = await prisma.siteSettings.upsert({
            where: { id: "default" },
            update: updateData,
            create: { 
                id: "default", 
                defaultTheme: updateData.defaultTheme || "dark",
                geminiApiKey: updateData.geminiApiKey || null
            },
        });

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
