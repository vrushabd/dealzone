import type { Metadata } from "next";
import InfoPage from "@/components/legal/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Disclaimer",
    description: "Read the ZenCult disclaimer covering product availability, shipping, returns, and general store policies.",
    path: "/disclaimer",
});

export default function DisclaimerPage() {
    return (
        <InfoPage
            eyebrow="Disclaimer"
            title="General Store Policies and Information."
            intro="ZenCult is committed to providing high-quality products and excellent service. Please read this disclaimer to understand our policies regarding product availability, shipping, and general use of our store."
            sections={[
                {
                    title: "Product Information & Availability",
                    body: [
                        "We strive to display product colors, descriptions, and specifications as accurately as possible. However, actual colors may vary slightly depending on your device's display settings.",
                        "All products are subject to availability. We reserve the right to limit the quantities of any products we offer or to discontinue products at any time without notice.",
                    ],
                },
                {
                    title: "Pricing & Promotions",
                    body: [
                        "Prices for our products are subject to change without notice.",
                        "Promotional offers, discounts, and coupon codes may have specific terms, conditions, and expiration dates. We reserve the right to modify or cancel promotions at our discretion.",
                    ],
                },
                {
                    title: "Shipping & Delivery",
                    body: [
                        "Estimated delivery times are provided as a guideline and are not guaranteed. Delays may occur due to unforeseen circumstances, carrier issues, or high order volumes.",
                        "We are not liable for any delays in shipping once the package has been handed over to the carrier.",
                    ],
                },
                {
                    title: "Content & Advice",
                    body: [
                        "Buying guides, blog posts, and product recommendations are provided for informational purposes only. They are meant to assist your decision-making, not replace your own review of the product.",
                        "We do not guarantee that every product recommendation is the best option for every user or specific use case.",
                    ],
                },
            ]}
        />
    );
}
