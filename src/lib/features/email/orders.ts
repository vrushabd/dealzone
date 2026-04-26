import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

type OrderEmailItem = {
    productTitle: string;
    productImage?: string | null;
    quantity: number;
    price: number;
};

type OrderEmailInput = {
    kind: "placed" | "paid" | "shipped" | "delivered";
    userEmail: string;
    shippingName: string;
    orderId: string;
    paymentMethod: string;
    items: OrderEmailItem[];
    subtotal: number;
    shippingFee: number;
    total: number;
};

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatPrice(value: number) {
    return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function getMailConfig() {
    const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
    const apiKey = settings?.resendApiKey || process.env.RESEND_API_KEY;
    const siteName = settings?.siteName || "GenzLoots";
    const senderEmail = process.env.RESEND_SENDER_EMAIL || "onboarding@resend.dev";
    return { apiKey, siteName, senderEmail };
}

export async function sendOrderEmail(input: OrderEmailInput) {
    const { apiKey, siteName, senderEmail } = await getMailConfig();

    if (!apiKey) {
        console.warn("[order-email] Missing Resend API key.");
        return { success: false, error: "Missing API key" };
    }

    const baseUrl = appUrl();
    const orderUrl = `${baseUrl}/orders/${encodeURIComponent(input.orderId)}`;
    const orderShortId = input.orderId.slice(-8).toUpperCase();
    const paymentLabel = input.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment";
    const heading = input.kind === "paid" ? "Payment received. Your order is confirmed." 
                  : input.kind === "shipped" ? "Your order has been shipped!"
                  : input.kind === "delivered" ? "Your order has been delivered."
                  : "Your order has been placed.";
    const intro = input.kind === "paid"
        ? "We have received your payment and started processing your order. Estimated delivery is 5-7 days."
        : input.kind === "shipped"
            ? "Great news! Your order has been shipped and is on its way to you. Delivery takes 5-7 days."
            : input.kind === "delivered"
                ? "Your order has been successfully delivered. Thank you for shopping with us!"
                : input.paymentMethod === "COD"
                    ? "Your cash on delivery order is confirmed. We will start processing it shortly. Estimated delivery is 5-7 days."
                    : "Your order is saved and awaiting payment confirmation.";

    const itemsHtml = input.items.map((item) => {
        const title = escapeHtml(item.productTitle);
        const image = item.productImage ? escapeHtml(item.productImage) : null;
        return `
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="60" valign="top" style="padding-right:12px;">
                    ${image ? `<img src="${image}" alt="${title}" width="52" height="52" style="width:52px;height:52px;object-fit:contain;border:1px solid #e5e7eb;border-radius:8px;background:#ffffff;display:block;" />` : ""}
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 4px;color:#111827;font-size:14px;font-weight:700;line-height:1.4;">${title}</p>
                    <p style="margin:0;color:#6b7280;font-size:12px;">Qty ${item.quantity} × ₹${formatPrice(item.price)}</p>
                  </td>
                  <td valign="top" align="right" style="white-space:nowrap;color:#111827;font-size:14px;font-weight:700;">
                    ₹${formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
    }).join("");

    const plainTextItems = input.items
        .map((item) => `- ${item.productTitle} | Qty ${item.quantity} x Rs.${formatPrice(item.price)} = Rs.${formatPrice(item.price * item.quantity)}`)
        .join("\n");

    const subject = input.kind === "paid"
        ? `Payment confirmed for order #${orderShortId} - ${siteName}`
        : input.kind === "shipped"
            ? `Order #${orderShortId} shipped - ${siteName}`
            : input.kind === "delivered"
                ? `Order #${orderShortId} delivered - ${siteName}`
                : `Order #${orderShortId} placed successfully - ${siteName}`;

    const plainText = [
        `${siteName}`,
        ``,
        heading,
        intro,
        ``,
        `Order ID: ${input.orderId}`,
        `Payment: ${paymentLabel}`,
        ``,
        plainTextItems,
        ``,
        `Subtotal: Rs.${formatPrice(input.subtotal)}`,
        `Shipping: ${input.shippingFee > 0 ? `Rs.${formatPrice(input.shippingFee)}` : "FREE"}`,
        `Total: Rs.${formatPrice(input.total)}`,
        ``,
        `Track your order: ${orderUrl}`,
        ``,
        `Thank you,`,
        `${siteName}`,
    ].join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${siteName} Order Update</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);">
              <p style="margin:0 0 8px;color:#dbeafe;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${siteName}</p>
              <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.3;">${escapeHtml(heading)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 20px;">
              <p style="margin:0 0 8px;color:#111827;font-size:15px;">Hi ${escapeHtml(input.shippingName)},</p>
              <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">${escapeHtml(intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:0 18px;">
                <tr>
                  <td style="padding:18px 0 10px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Order ID</td>
                        <td align="right" style="color:#111827;font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escapeHtml(input.orderId)}</td>
                      </tr>
                      <tr>
                        <td style="padding-top:8px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Payment</td>
                        <td align="right" style="padding-top:8px;color:#111827;font-size:13px;">${escapeHtml(paymentLabel)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${itemsHtml}
                <tr>
                  <td style="padding:16px 0 18px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="color:#6b7280;font-size:13px;">Subtotal</td>
                        <td align="right" style="color:#111827;font-size:13px;">₹${formatPrice(input.subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="padding-top:8px;color:#6b7280;font-size:13px;">Shipping</td>
                        <td align="right" style="padding-top:8px;color:#111827;font-size:13px;">${input.shippingFee > 0 ? `₹${formatPrice(input.shippingFee)}` : "FREE"}</td>
                      </tr>
                      <tr>
                        <td style="padding-top:12px;color:#111827;font-size:15px;font-weight:800;">Total</td>
                        <td align="right" style="padding-top:12px;color:#2563eb;font-size:17px;font-weight:800;">₹${formatPrice(input.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 28px;">
              <a href="${orderUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 26px;border-radius:8px;">
                View Order Details
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.7;text-align:center;">
              Thank you for shopping with ${siteName}.<br />
              For help with your order, reply to this email or visit ${escapeHtml(baseUrl)}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
        const resend = new Resend(apiKey);
        const result = await resend.emails.send({
            from: `${siteName} <${senderEmail}>`,
            to: [input.userEmail],
            subject,
            html,
            text: plainText,
            headers: {
                "X-Entity-Ref-ID": `genzloots-order-${input.kind}-${input.orderId}`,
            },
        });

        return { success: true, result };
    } catch (error) {
        console.error("[order-email] Failed to send:", error);
        return { success: false, error };
    }
}

export async function sendOrderPlacedEmail(input: Omit<OrderEmailInput, "kind">) {
    return sendOrderEmail({ ...input, kind: "placed" });
}

export async function sendPaymentConfirmedEmail(input: Omit<OrderEmailInput, "kind">) {
    return sendOrderEmail({ ...input, kind: "paid" });
}

export async function sendOrderShippedEmail(input: Omit<OrderEmailInput, "kind">) {
    return sendOrderEmail({ ...input, kind: "shipped" });
}

export async function sendOrderDeliveredEmail(input: Omit<OrderEmailInput, "kind">) {
    return sendOrderEmail({ ...input, kind: "delivered" });
}
