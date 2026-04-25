import { prisma } from "@/lib/prisma";

export type IncomingReview = {
    rating: number;
    title?: string | null;
    comment: string;
    author?: string | null;
};

function normalizeText(value: string | null | undefined) {
    return value?.replace(/\s+/g, " ").trim() || "";
}

function reviewFingerprint(review: IncomingReview) {
    return [
        normalizeText(review.author).toLowerCase(),
        normalizeText(review.title).toLowerCase(),
        normalizeText(review.comment).toLowerCase(),
    ].join("::");
}

export function normalizeIncomingReviews(reviews: IncomingReview[] | null | undefined) {
    if (!Array.isArray(reviews)) return [];

    const unique = new Map<string, IncomingReview>();

    for (const review of reviews) {
        const comment = normalizeText(review.comment);
        const rating = Number(review.rating);

        if (!comment || comment.length < 6) continue;
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue;

        const normalized: IncomingReview = {
            rating,
            title: normalizeText(review.title) || null,
            comment,
            author: normalizeText(review.author) || null,
        };

        unique.set(reviewFingerprint(normalized), normalized);
    }

    return Array.from(unique.values()).slice(0, 8);
}

export async function mergeProductReviews(productId: string, incomingReviews: IncomingReview[] | null | undefined) {
    const normalizedIncoming = normalizeIncomingReviews(incomingReviews);
    if (normalizedIncoming.length === 0) {
        return { created: 0 };
    }

    const existingReviews = await prisma.productReview.findMany({
        where: { productId },
        select: {
            rating: true,
            title: true,
            comment: true,
            author: true,
        },
    });

    const existingFingerprints = new Set(existingReviews.map(reviewFingerprint));
    const reviewsToCreate = normalizedIncoming.filter((review) => !existingFingerprints.has(reviewFingerprint(review)));

    if (reviewsToCreate.length === 0) {
        return { created: 0 };
    }

    await prisma.productReview.createMany({
        data: reviewsToCreate.map((review) => ({
            productId,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            author: review.author,
        })),
    });

    return { created: reviewsToCreate.length };
}
