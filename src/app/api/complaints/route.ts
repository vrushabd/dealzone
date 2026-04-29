import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — submit a complaint (public)
export async function POST(req: NextRequest) {
    try {
        const { name, email, subject, message } = await req.json();

        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }

        const complaint = await prisma.complaint.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                subject: subject.trim(),
                message: message.trim(),
            },
        });

        return NextResponse.json({ ok: true, id: complaint.id }, { status: 201 });
    } catch (err) {
        console.error("Complaint submission error:", err);
        return NextResponse.json({ error: "Failed to submit complaint." }, { status: 500 });
    }
}
