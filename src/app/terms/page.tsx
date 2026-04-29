import type { Metadata } from "next";
import InfoPage from "@/components/legal/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Terms of Use",
    description: "Read the ZenCult terms covering website use, purchases, account responsibilities, and store policies.",
    path: "/terms",
});

export default function TermsPage() {
    return (
        <InfoPage
            eyebrow="Terms"
            title="Use the site responsibly and understand our policies."
            intro="By accessing and using ZenCult, you agree to comply with these terms of use. These terms govern your use of our website and any purchases made through our store."
            sections={[
                {
                    title: "Using the Website",
                    body: [
                        "You may browse products, create an account, place orders, and read blog posts for personal and lawful use.",
                        "You must provide accurate and complete information when creating an account or placing an order.",
                        "You should not attempt to abuse the site, interfere with our systems, or automate actions that degrade service for other users.",
                    ],
                },
                {
                    title: "Purchases & Payments",
                    body: [
                        "By placing an order, you agree to pay the total amount specified, including any applicable taxes and shipping fees.",
                        "We reserve the right to refuse or cancel any order for reasons including, but not limited to, product unavailability, errors in pricing, or suspected fraudulent activity.",
                    ],
                },
                {
                    title: "Content Ownership",
                    body: [
                        "The branding, layout, original imagery, and editorial content on ZenCult remain the property of the site owner unless otherwise stated.",
                        "You may not reproduce, distribute, or use our content for commercial purposes without explicit written permission.",
                    ],
                },
                {
                    title: "Returns & Refunds",
                    body: [
                        "If you receive a defective or incorrect item, please contact us within 7 days of delivery with photos of the issue.",
                        "Refunds and replacements are processed in accordance with our standard return policy and are subject to approval.",
                    ],
                },
            ]}
        />
    );
}
