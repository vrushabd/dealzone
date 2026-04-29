import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    try {
        await prisma.productReview.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[DELETE /api/admin/comments/:id]", err);
        return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
}
