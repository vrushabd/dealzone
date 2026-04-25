"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, MapPin, Package, ChevronRight, Save, Loader2, CheckCircle2, ShoppingBag } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login?callbackUrl=/profile");
        if (session?.user?.name) {
            setForm(f => ({ ...f, name: session.user!.name || "" }));
        }
    }, [status, session, router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Future: POST /api/user/profile to update address
        await new Promise(r => setTimeout(r, 800));
        setSaved(true);
        setLoading(false);
        setTimeout(() => setSaved(false), 2500);
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
                <Loader2 size={28} className="animate-spin text-[var(--brand)]" />
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[var(--bg-base)] py-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
                        <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
                        <ChevronRight size={14} />
                        <span className="text-[var(--text-secondary)]">My Profile</span>
                    </nav>

                    {/* Profile Header */}
                    <div className="flex items-center gap-4 mb-8 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                        <div className="w-14 h-14 rounded-full bg-[var(--brand)] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-[var(--shadow-brand)]">
                            {session?.user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[var(--text-primary)]">{session?.user?.name}</h1>
                            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                                <Mail size={13} /> {session?.user?.email}
                            </p>
                        </div>
                        <Link href="/orders" className="ml-auto flex items-center gap-2 text-sm font-semibold text-[var(--brand)] bg-[hsl(214_89%_52%/0.08)] border border-[hsl(214_89%_52%/0.2)] px-3.5 py-2 rounded-lg hover:bg-[hsl(214_89%_52%/0.15)] transition-all">
                            <Package size={15} /> My Orders
                        </Link>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                        {[
                            { label: "My Orders", href: "/orders", icon: Package, sub: "Track all orders" },
                            { label: "Browse Deals", href: "/products", icon: ShoppingBag, sub: "Find latest deals" },
                            { label: "Price Tracker", href: "/price-tracker", icon: ChevronRight, sub: "Set price alerts" },
                        ].map(item => (
                            <Link key={item.href} href={item.href}
                                className="flex items-center gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-[var(--border-brand)] hover:bg-[hsl(214_89%_52%/0.04)] transition-all group">
                                <item.icon size={18} className="text-[var(--brand)] group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{item.sub}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Address Form */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                        <h2 className="font-bold text-[var(--text-primary)] text-lg mb-5 flex items-center gap-2">
                            <MapPin size={18} className="text-[var(--brand)]" /> Saved Address
                            <span className="text-xs text-[var(--text-muted)] font-normal ml-1">(auto-fills at checkout)</span>
                        </h2>

                        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="input-base pl-9" placeholder="Your full name" />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Phone</label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        className="input-base pl-9" placeholder="+91 98765 43210" />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Street Address</label>
                                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                    className="input-base" placeholder="Flat, House No, Building, Street" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">City</label>
                                <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                    className="input-base" placeholder="City" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">State</label>
                                <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                                    className="input-base" placeholder="State" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Pincode</label>
                                <input type="text" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                                    className="input-base" placeholder="6-digit pincode" maxLength={6} />
                            </div>

                            <div className="sm:col-span-2 flex items-center gap-3">
                                <button type="submit" disabled={loading}
                                    className="flex items-center gap-2 btn-primary px-6 py-2.5 text-sm font-bold shine-on-hover disabled:opacity-60">
                                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                    Save Address
                                </button>
                                {saved && (
                                    <span className="flex items-center gap-1.5 text-sm text-green-500 font-semibold animate-fade-in">
                                        <CheckCircle2 size={15} /> Saved!
                                    </span>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
