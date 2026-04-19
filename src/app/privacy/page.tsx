import type { Metadata } from "next";
import InfoPage from "@/components/legal/InfoPage";

export const metadata: Metadata = {
    title: "Privacy Policy | GenzLoots",
    description: "Read the GenzLoots privacy policy covering analytics, alerts, and how basic visitor data is used.",
};

export default function PrivacyPage() {
    return (
        <InfoPage
            eyebrow="Privacy"
            title="We keep data collection practical and limited."
            intro="GenzLoots uses lightweight analytics and product tracking data so we can measure clicks, understand traffic, and power features like price drop alerts."
            sections={[
                {
                    title: "What We Collect",
                    body: [
                        "We may store basic information such as page views, session identifiers, affiliate click events, alert email addresses, and product tracking preferences.",
                        "If you contact us directly, we also receive whatever information you choose to include in your message.",
                    ],
                },
                {
                    title: "How We Use It",
                    body: [
                        "We use this information to improve site performance, measure deal engagement, send requested alerts, and investigate broken listings or tracking issues.",
                        "We do not sell your personal information. We only use data that helps the site function and improves the shopping experience.",
                    ],
                },
                {
                    title: "Third-Party Services",
                    body: [
                        "GenzLoots may rely on third-party services for hosting, authentication, database storage, email delivery, and merchant redirects.",
                        "Those services process data only as needed to support the app features you use.",
                    ],
                },
            ]}
        />
    );
}
