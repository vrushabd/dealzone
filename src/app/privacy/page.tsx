import type { Metadata } from "next";
import InfoPage from "@/components/legal/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Privacy Policy",
    description: "Read the ZenCult privacy policy covering data collection, order processing, and customer privacy.",
    path: "/privacy",
});

export default function PrivacyPage() {
    return (
        <InfoPage
            eyebrow="Privacy"
            title="We respect your privacy and protect your data."
            intro="ZenCult collects only the necessary information to process your orders securely and provide a seamless shopping experience. We are committed to safeguarding your personal data."
            sections={[
                {
                    title: "What We Collect",
                    body: [
                        "When you create an account or place an order, we collect essential information such as your name, shipping address, email address, and phone number.",
                        "We also store basic analytics information such as page views and session identifiers to improve our website experience.",
                        "We do not store complete payment details (like full credit card numbers) on our servers; these are handled securely by our payment processors.",
                    ],
                },
                {
                    title: "How We Use It",
                    body: [
                        "Your information is primarily used to fulfill your orders, provide customer support, and communicate with you about your purchases.",
                        "We may use your email to send you important order updates, shipping notifications, and occasionally promotional offers (if you opt-in).",
                        "We do not sell, rent, or trade your personal information to third parties.",
                    ],
                },
                {
                    title: "Third-Party Services",
                    body: [
                        "We use trusted third-party services for essential store functions: hosting, secure payment processing, database storage, and email delivery.",
                        "These service providers only process data as necessary to perform their functions securely and in compliance with privacy standards.",
                    ],
                },
                {
                    title: "Your Data Rights",
                    body: [
                        "You have the right to access, update, or request the deletion of your personal information stored in your account.",
                        "If you have any questions about your data or wish to exercise these rights, please contact us at zencultstore@gmail.com.",
                    ],
                },
            ]}
        />
    );
}
