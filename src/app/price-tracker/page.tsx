import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PriceTracker } from "@/components/features/PriceTracker";
import { History, Search, Bell, TrendingDown } from "lucide-react";

export const metadata: Metadata = {
    title: "Price History Tracker",
    description: "Track Amazon & Flipkart product prices. See historical price trends and set alerts for drops.",
};

export default function PriceTrackerPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
            <Navbar />
            
            <main className="flex-1 py-12 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16 animate-fade-in">
                        <div className="inline-flex items-center gap-2 bg-[hsl(214_89%_52%/0.08)] text-[hsl(214_89%_52%)] px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest border border-[hsl(214_89%_52%/0.20)] mb-6 backdrop-blur-sm">
                            <TrendingDown size={14} />
                            Save up to 60%
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--text-primary)] mb-6 tracking-tight leading-[1.1]">
                            Never Pay <span className="text-[hsl(214_89%_52%)]">Full Price</span> <br className="hidden sm:block" /> Again
                        </h1>
                        <p className="text-[var(--text-secondary)] text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                            Our AI-powered tracker monitors millions of price drops daily. Paste a link below to check if you&apos;re getting a real deal or a fake discount.
                        </p>
                    </div>

                    {/* Tracker Section */}
                    <PriceTracker />

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-lg hover:border-[hsl(214_89%_52%/0.30)] transition-all hover:shadow-xl group">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Search className="text-blue-500" size={24} />
                            </div>
                            <h3 className="font-bold text-[var(--text-primary)] text-lg mb-3">Universal Check</h3>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                Simply paste any product link from Amazon.in or Flipkart.com. We automatically detect and fetch the latest price data.
                            </p>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-lg hover:border-[hsl(214_89%_52%/0.30)] transition-all hover:shadow-xl group">
                            <div className="w-12 h-12 bg-green-500/10 rounded-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <History className="text-green-500" size={24} />
                            </div>
                            <h3 className="font-bold text-[var(--text-primary)] text-lg mb-3">Price History</h3>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                See how the price has changed over the last 30, 60, or 90 days. Avoid &quot;sale&quot; prices that are actually higher than last week.
                            </p>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-lg hover:border-[hsl(214_89%_52%/0.30)] transition-all hover:shadow-xl group">
                            <div className="w-12 h-12 bg-[hsl(214_89%_52%/0.08)] rounded-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Bell className="text-[hsl(214_89%_52%)]" size={24} />
                            </div>
                            <h3 className="font-bold text-[var(--text-primary)] text-lg mb-3">Smart Alerts</h3>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                Coming soon: Set a target price and we&apos;ll notify you instantly via email or push notification when the product hits your goal.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
