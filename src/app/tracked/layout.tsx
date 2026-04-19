import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tracked Products",
    robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
    },
};

export default function TrackedLayout({ children }: { children: React.ReactNode }) {
    return children;
}
