import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET all complaints (admin only)
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const complaints = await prisma.complaint.findMany({
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(complaints);
}

// PATCH update complaint status (admin only)
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

    const valid = ["open", "in_review", "resolved"];
    if (!valid.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const updated = await prisma.complaint.update({ where: { id }, data: { status } });
    return NextResponse.json(updated);
}

// DELETE complaint (admin only)
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.complaint.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
