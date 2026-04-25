import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, Package, ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

const SUPPORT_EMAIL = "zencultstore@gmail.com";

export const metadata: Metadata = buildMetadata({
    title: "Contact Us",
    description: "Contact GenzLoots for support, order inquiries, shipping questions, and partnership enquiries.",
    path: "/contact",
});

export default function ContactPage() {
    const contactCards = [
        {
            title: "General Support",
            description: "Questions about our products, website issues, or your account.",
            value: SUPPORT_EMAIL,
            href: `mailto:${SUPPORT_EMAIL}`,
            icon: Mail,
        },
        {
            title: "Order & Shipping",
            description: "Need help with an existing order, tracking, or delivery issues?",
            value: "Check order status",
            href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("GenzLoots Order Support")}`,
            icon: Package,
        },
        {
            title: "Business & Partnerships",
            description: "For wholesale inquiries, brand collaborations, or media requests.",
            value: "Partnership enquiries",
            href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("GenzLoots Partnership Enquiry")}`,
            icon: ShieldCheck,
        },
    ];

    return (
        <>
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-10 max-w-3xl">
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[hsl(214_89%_55%)]">
                        Contact Us
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] sm:text-4xl">
                        We are happy to hear from you.
                    </h1>
                    <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                        Reach out for support, order questions, or anything else related to GenzLoots.
                        The fastest way to get a response right now is email.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {contactCards.map(({ title, description, value, href, icon: Icon }) => (
                        <Link
                            key={title}
                            href={href}
                            className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors hover:border-[hsl(214_89%_52%/0.3)] hover:bg-[var(--bg-card-hover)]"
                        >
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-[hsl(214_89%_52%/0.1)] text-[hsl(214_89%_55%)]">
                                <Icon size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                            <div className="mt-5 text-sm font-semibold text-[hsl(214_89%_55%)]">{value}</div>
                        </Link>
                    ))}
                </div>

                <section className="mt-8 rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-6">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Before you write in</h2>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                        <li>Include your Order ID if you are contacting us about an existing purchase.</li>
                        <li>Please allow 24-48 hours for a response during busy periods.</li>
                        <li>For urgent issues, include screenshots or photos of the product if applicable.</li>
                    </ul>
                </section>
            </main>
            <Footer />
        </>
    );
}
