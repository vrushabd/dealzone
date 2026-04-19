import type { Metadata } from "next";
import InfoPage from "@/components/legal/InfoPage";

export const metadata: Metadata = {
    title: "Disclaimer | GenzLoots",
    description: "Read the GenzLoots disclaimer covering affiliate relationships, pricing accuracy, and third-party links.",
};

export default function DisclaimerPage() {
    return (
        <InfoPage
            eyebrow="Disclaimer"
            title="Please verify prices and offers before you buy."
            intro="GenzLoots curates deals, affiliate listings, blog content, and pricing alerts to help you shop smarter. We work hard to keep everything accurate, but prices, availability, discounts, and product details can change quickly on merchant sites."
            sections={[
                {
                    title: "Affiliate Relationships",
                    body: [
                        "Some links on GenzLoots are affiliate links. If you click and make a purchase, we may earn a commission at no extra cost to you.",
                        "Affiliate partnerships do not change the price you pay, but they do help us keep the site running and maintain tracking tools, alerts, and content.",
                    ],
                },
                {
                    title: "Pricing & Availability",
                    body: [
                        "Product prices, stock status, cashback, coupon validity, and shipping terms can change without notice. Merchant pages always have the final say.",
                        "If a price or offer looks different after you click through, please rely on the store listing and not the cached value shown on GenzLoots.",
                    ],
                },
                {
                    title: "Third-Party Stores",
                    body: [
                        "GenzLoots links to third-party merchants such as Amazon, Flipkart, Myntra, and other platforms. We do not control their product pages, return policies, delivery timelines, or checkout systems.",
                        "Any issue related to payment, refunds, damaged goods, shipping, or warranty should be resolved directly with the merchant or seller.",
                    ],
                },
                {
                    title: "Content & Advice",
                    body: [
                        "Buying guides, blog posts, AI suggestions, and price trend summaries are provided for informational purposes only. They are meant to assist your decision-making, not replace your own review of the product and seller.",
                        "We do not guarantee that every product recommendation is the best option for every user, budget, or use case.",
                    ],
                },
            ]}
        />
    );
}
