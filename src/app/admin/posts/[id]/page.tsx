import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import PostEditorForm from "@/components/admin/PostEditorForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
    params: Promise<{ id: string }>;
}

export default async function EditAdminPostPage({ params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/admin/login");
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            image: true,
            published: true,
        },
    });

    if (!post) {
        notFound();
    }

    return <PostEditorForm mode="edit" initial={post} />;
}
