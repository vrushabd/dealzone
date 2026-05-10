import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { response } = await requireAdminSession();
    if (response) return response;

    const { id } = await params;
    try {
        await prisma.productReview.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[DELETE /api/admin/comments/:id]", err);
        return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
}
