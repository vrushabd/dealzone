import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

export interface PriceDropData {
    userEmail: string;
    productTitle: string;
    productSlug: string;
    productImage?: string | null;
    oldPrice: number;
    newPrice: number;
    targetPrice: number;
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatPrice(value: number) {
    return value.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });
}

function appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function sendPriceDropEmail(data: PriceDropData) {
    const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
    const apiKey = settings?.resendApiKey || process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn("Emails not configured. Missing RESEND_API_KEY.");
        return { success: false, error: "Missing API Key" };
    }

    // You MUST verify a custom domain on Resend to send from it, 
    // or use your own verified email address for testing.
    const senderEmail = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
    
    const percentageDrop = data.oldPrice > 0
        ? Math.max(0, Math.round(((data.oldPrice - data.newPrice) / data.oldPrice) * 100))
        : 0;
    const productTitle = escapeHtml(data.productTitle);
    const productImage = data.productImage ? escapeHtml(data.productImage) : null;
    const productUrl = `${appUrl()}/products/${encodeURIComponent(data.productSlug)}`;

    const htmlTemplate = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #3b82f6; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">GenzLoots Alert</h1>
                </div>
                
                <div style="padding: 40px 30px;">
                    <h2 style="color: #111827; margin-top: 0; font-size: 20px; text-align: center;">Price Drop Alert!</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5; text-align: center;">
                        Great news! The price of an item you're tracking has dropped below your target price.
                    </p>

                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                        ${productImage ? `<img src="${productImage}" alt="Product" style="max-width: 150px; max-height: 150px; object-fit: contain; margin-bottom: 20px;" />` : ''}
                        <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">${productTitle}</h3>
                        
                        <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 10px;">
                            <span style="color: #9ca3af; text-decoration: line-through; font-size: 16px;">₹${formatPrice(data.oldPrice)}</span>
                            <span style="color: #10b981; font-weight: 800; font-size: 24px;">₹${formatPrice(data.newPrice)}</span>
                            <span style="background-color: #d1fae5; color: #059669; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: bold;">${percentageDrop}% OFF</span>
                        </div>
                        <p style="color: #6b7280; margin: 0; font-size: 14px;">Your Target: ₹${formatPrice(data.targetPrice)}</p>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${productUrl}" 
                           style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                           View Deal Now
                        </a>
                    </div>
                </div>

                <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        You received this because you set a Price Drop Alert on GenzLoots.
                    </p>
                </div>
            </div>
        </div>
    `;

    try {
        const resend = new Resend(apiKey);
        const result = await resend.emails.send({
            from: `GenzLoots <${senderEmail}>`,
            to: [data.userEmail],
            subject: `Price Drop! ${data.productTitle}`,
            html: htmlTemplate,
        });
        
        console.log(`Alert email sent to ${data.userEmail}:`, result);
        return { success: true, result };
    } catch (error) {
        console.error("Failed to send Resend email:", error);
        return { success: false, error };
    }
}
