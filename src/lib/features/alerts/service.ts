import { prisma } from "@/lib/prisma";
import { sendPriceDropEmail } from "@/lib/features/email/sender";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CreateEmailAlertInput {
    email: string;
    productId: string;
    targetPrice: number;
}

export interface TriggerPriceAlertsInput {
    productId: string;
    productTitle: string;
    productSlug: string;
    productImage?: string | null;
    oldPrice?: number | null;
    newPrice: number;
}

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export function parseTargetPrice(value: unknown) {
    const numberValue = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
    if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
    return numberValue;
}

export async function createEmailPriceAlert(input: CreateEmailAlertInput) {
    const email = normalizeEmail(input.email);
    if (!EMAIL_RE.test(email)) {
        return { ok: false as const, status: 400, error: "Enter a valid email address." };
    }

    const targetPrice = parseTargetPrice(input.targetPrice);
    if (!targetPrice) {
        return { ok: false as const, status: 400, error: "Enter a valid target price." };
    }

    const product = await prisma.product.findUnique({
        where: { id: input.productId },
        select: { id: true, price: true },
    });

    if (!product) {
        return { ok: false as const, status: 404, error: "Product not found." };
    }

    if (product.price && targetPrice >= product.price) {
        return {
            ok: false as const,
            status: 400,
            error: "Target price must be lower than the current price.",
        };
    }

    const alert = await prisma.priceAlert.create({
        data: {
            email,
            targetPrice,
            productId: product.id,
            isActive: true,
        },
        select: {
            id: true,
            targetPrice: true,
            createdAt: true,
        },
    });

    return { ok: true as const, alert };
}

export async function triggerPriceDropAlerts(input: TriggerPriceAlertsInput) {
    if (!Number.isFinite(input.newPrice) || input.newPrice <= 0) {
        return { attempted: 0, sent: 0, failed: 0 };
    }

    const triggeredAlerts = await prisma.priceAlert.findMany({
        where: {
            productId: input.productId,
            isActive: true,
            email: { not: null },
            targetPrice: { gte: input.newPrice },
        },
    });

    let sent = 0;
    let failed = 0;

    for (const alert of triggeredAlerts) {
        if (!alert.email) continue;

        const result = await sendPriceDropEmail({
            userEmail: alert.email,
            productTitle: input.productTitle,
            productSlug: input.productSlug,
            productImage: input.productImage,
            oldPrice: input.oldPrice && input.oldPrice > 0 ? input.oldPrice : input.newPrice,
            newPrice: input.newPrice,
            targetPrice: alert.targetPrice,
        });

        if (result.success) {
            await prisma.priceAlert.update({
                where: { id: alert.id },
                data: { isActive: false, emailSentAt: new Date() },
            });
            sent++;
        } else {
            console.error(`Price alert email failed for alert ${alert.id}:`, result.error);
            failed++;
        }
    }

    return { attempted: triggeredAlerts.length, sent, failed };
}
