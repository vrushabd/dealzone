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
    return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function sendPriceDropEmail(data: PriceDropData) {
    const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
    const apiKey = settings?.resendApiKey || process.env.RESEND_API_KEY;
    const siteName = settings?.siteName || "GenzLoots";

    if (!apiKey) {
        console.warn("Emails not configured. Missing RESEND_API_KEY.");
        return { success: false, error: "Missing API Key" };
    }

    // You MUST verify a custom domain on Resend to send from it.
    // Go to resend.com → Domains → Add your domain → add the DNS records (SPF + DKIM).
    // This is the #1 fix for emails going to spam.
    const senderEmail = process.env.RESEND_SENDER_EMAIL || "onboarding@resend.dev";

    const percentageDrop = data.oldPrice > 0
        ? Math.max(0, Math.round(((data.oldPrice - data.newPrice) / data.oldPrice) * 100))
        : 0;
    const productTitle = escapeHtml(data.productTitle);
    const productImage = data.productImage ? escapeHtml(data.productImage) : null;
    const baseUrl = appUrl();
    const productUrl = `${baseUrl}/products/${encodeURIComponent(data.productSlug)}`;

    // ── Plain-text version (critical for spam score — HTML-only emails get flagged) ──
    const plainText = [
        `${siteName} Price Drop Alert`,
        ``,
        `"${data.productTitle}" has dropped to your target price!`,
        ``,
        `Current Price : Rs.${formatPrice(data.newPrice)}  (was Rs.${formatPrice(data.oldPrice)}${percentageDrop > 0 ? `, ${percentageDrop}% off` : ""})`,
        `Your Target   : Rs.${formatPrice(data.targetPrice)}`,
        ``,
        `View the deal: ${productUrl}`,
        ``,
        `---`,
        `You set up a Price Drop Alert on ${siteName} (${baseUrl}).`,
        `This is a one-time notification. This alert has been automatically deactivated.`,
        `To stop all alerts, reply to this email with "unsubscribe".`,
    ].join("\n");

    // ── HTML version (proper table layout — inline CSS only) ─────────────────────
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Price Drop Alert — ${siteName}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:28px 32px;text-align:center;">
            <p style="margin:0 0 6px;color:#bfdbfe;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${siteName} · Price Alert</p>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;line-height:1.3;">&#127919; Target Price Reached!</h1>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
              Great news! A product you're tracking on <strong>${siteName}</strong> has dropped to or below your target price. Grab it before it goes back up!
            </p>
          </td>
        </tr>

        <!-- Product Card -->
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              ${productImage ? `<tr><td style="padding:20px;text-align:center;border-bottom:1px solid #e2e8f0;"><img src="${productImage}" alt="Product" width="120" height="120" style="max-width:120px;max-height:120px;object-fit:contain;display:block;margin:0 auto;" /></td></tr>` : ""}
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 18px;color:#111827;font-size:15px;font-weight:700;line-height:1.5;">${productTitle}</p>

                  <!-- Price comparison row -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="width:33%;text-align:center;padding:12px 8px;background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;">
                        <p style="margin:0 0 3px;color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Was</p>
                        <p style="margin:0;color:#9ca3af;font-size:17px;text-decoration:line-through;">&#8377;${formatPrice(data.oldPrice)}</p>
                      </td>
                      <td style="width:10%;text-align:center;color:#cbd5e1;font-size:18px;padding:0 4px;">&#8594;</td>
                      <td style="width:33%;text-align:center;padding:12px 8px;background:#f0fdf4;border:2px solid #86efac;border-radius:6px;">
                        <p style="margin:0 0 3px;color:#15803d;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Now</p>
                        <p style="margin:0;color:#15803d;font-size:22px;font-weight:800;">&#8377;${formatPrice(data.newPrice)}</p>
                      </td>
                      ${percentageDrop > 0 ? `<td style="width:24%;text-align:center;padding:0 0 0 8px;"><span style="display:inline-block;background:#dcfce7;color:#15803d;font-size:13px;font-weight:800;padding:6px 12px;border-radius:999px;border:1px solid #86efac;">${percentageDrop}%&nbsp;OFF</span></td>` : ""}
                    </tr>
                  </table>

                  <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
                    Your alert target was &#8377;${formatPrice(data.targetPrice)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:8px 32px 32px;text-align:center;">
            <a href="${productUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;letter-spacing:0.01em;">
              View Deal on ${siteName} &#8594;
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 5px;color:#9ca3af;font-size:12px;line-height:1.6;">
              You received this because you set a Price Drop Alert on
              <a href="${baseUrl}" style="color:#3b82f6;text-decoration:none;">${siteName}</a>.
            </p>
            <p style="margin:0;color:#d1d5db;font-size:11px;">
              This is a one-time notification. Your alert has been automatically deactivated.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
        const resend = new Resend(apiKey);
        const result = await resend.emails.send({
            from: `${siteName} <${senderEmail}>`,
            to: [data.userEmail],
            // Specific subject = looks transactional, not spammy.
            // Generic "Price Drop Alert!" triggers spam filters.
            subject: `Price dropped to \u20b9${formatPrice(data.newPrice)} \u2014 ${data.productTitle.slice(0, 55)}`,
            html: htmlTemplate,
            text: plainText,
            headers: {
                // Gmail Bulk Sender requirement — without this Gmail may auto-spam transactional mail
                "List-Unsubscribe": `<mailto:${senderEmail}?subject=Unsubscribe>, <${baseUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                // Unique ID per alert prevents Gmail grouping these as a "campaign"
                "X-Entity-Ref-ID": `genzloots-pricealert-${data.productSlug}-${Date.now()}`,
            },
        });

        console.log(`Alert email sent to ${data.userEmail}:`, result);
        return { success: true, result };
    } catch (error) {
        console.error("Failed to send Resend email:", error);
        return { success: false, error };
    }
}
