import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const publishedOnly = searchParams.get("published");
        const search = searchParams.get("search");
        const limit = searchParams.get("limit");

        const posts = await prisma.post.findMany({
            where: {
                ...(publishedOnly === "true" && { published: true }),
                ...(search && {
                    OR: [{ title: { contains: search } }, { excerpt: { contains: search } }],
                }),
            },
            orderBy: { createdAt: "desc" },
            ...(limit && { take: parseInt(limit) }),
        });

        return NextResponse.json(posts);
    } catch {
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await request.json();
        const slug = slugify(data.title, { lower: true, strict: true });
        const post = await prisma.post.create({
            data: {
                title: data.title,
                slug,
                content: data.content,
                excerpt: data.excerpt || null,
                image: data.image || null,
                published: data.published || false,
            },
        });
        return NextResponse.json(post, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to create post";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
