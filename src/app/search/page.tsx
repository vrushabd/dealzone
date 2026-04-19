import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchClient from "./SearchClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Search Deals and Shopping Guides",
    description: "Search GenzLoots for online deals, product price drops, coupons, and shopping guide articles.",
    path: "/search",
    noIndex: true,
});

export default function SearchPage() {
    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Search Results</h1>
                <SearchClient />
            </main>
            <Footer />
        </>
    );
}
