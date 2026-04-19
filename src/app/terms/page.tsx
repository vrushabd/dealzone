import type { Metadata } from "next";
import InfoPage from "@/components/legal/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Terms of Use",
    description: "Read the GenzLoots terms covering website use, deal content, third-party merchant links, and shopping responsibilities.",
    path: "/terms",
});

export default function TermsPage() {
    return (
        <InfoPage
            eyebrow="Terms"
            title="Use the site responsibly and verify details before purchase."
            intro="By using GenzLoots, you agree to use the site for lawful browsing, deal discovery, and product research. You also understand that merchant listings and offers may change at any time."
            sections={[
                {
                    title: "Using the Website",
                    body: [
                        "You may browse products, read blog posts, use price alerts, and click merchant links for personal and lawful use.",
                        "You should not attempt to abuse the site, interfere with tracking systems, or automate actions that degrade service for other users.",
                    ],
                },
                {
                    title: "Content Ownership",
                    body: [
                        "The branding, layout, editorial content, and original deal summaries on GenzLoots remain the property of the site owner unless otherwise stated.",
                        "Brand names, logos, and product imagery referenced from merchants remain the property of their respective owners.",
                    ],
                },
                {
                    title: "External Merchant Links",
                    body: [
                        "When you leave GenzLoots and visit a merchant site, that merchant's own policies, terms, and pricing rules apply.",
                        "We are not responsible for a merchant changing price, removing stock, rejecting a coupon, or changing a listing after you click through.",
                    ],
                },
            ]}
        />
    );
}
