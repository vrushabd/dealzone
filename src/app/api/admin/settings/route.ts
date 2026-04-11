import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
        return NextResponse.json({ defaultTheme: settings?.defaultTheme || "dark" });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { defaultTheme } = await req.json();

        if (!["light", "dark"].includes(defaultTheme)) {
            return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
        }

        const settings = await prisma.siteSettings.upsert({
            where: { id: "default" },
            update: { defaultTheme },
            create: { id: "default", defaultTheme },
        });

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
