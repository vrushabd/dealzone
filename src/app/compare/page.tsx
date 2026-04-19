import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CompareClient from "./CompareClient";
import { breadcrumbJsonLd, buildMetadata, jsonLdScript } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Amazon, Flipkart & Myntra Price Comparison Tool",
    description: "Compare product prices across Amazon, Flipkart, and Myntra with real-time scraping, seller details, and smart buying insights.",
    path: "/compare",
});

export default function ComparePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Compare", path: "/compare" },
                ]))}
            />
            <Navbar />
            <CompareClient />
            <Footer />
        </>
    );
}
