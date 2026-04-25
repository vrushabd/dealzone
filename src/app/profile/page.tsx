"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    User, Mail, Phone, MapPin, Package,
    ChevronRight, Save, Loader2, CheckCircle2,
    ShoppingBag, AlertCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
    "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

type FormState = { name: string; phone: string; address: string; city: string; state: string; pincode: string };
type Errors = Partial<FormState>;

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [form, setForm] = useState<FormState>({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });
    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [serverError, setServerError] = useState("");

    // Redirect if not logged in
    useEffect(() => {
        if (status === "unauthenticated") router.push("/login?callbackUrl=/profile");
    }, [status, router]);

    // Load existing profile from DB
    useEffect(() => {
        if (status !== "authenticated") return;
        (async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const { user } = await res.json();
                    if (user) setForm({ name: user.name || "", phone: user.phone || "", address: user.address || "", city: user.city || "", state: user.state || "", pincode: user.pincode || "" });
                }
            } finally { setFetchLoading(false); }
        })();
    }, [status]);

    const validate = (): Errors => {
        const e: Errors = {};
        if (!form.name.trim()) e.name = "Full name is required";
        if (!form.phone.trim()) e.phone = "Phone is required";
        else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) e.phone = "Enter a valid 10-digit phone number";
        if (!form.address.trim()) e.address = "Street address is required";
        if (!form.city.trim()) e.city = "City is required";
        if (!form.state.trim()) e.state = "State is required";
        if (!form.pincode.trim()) e.pincode = "Pincode is required";
        else if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Must be a 6-digit pincode";
        return e;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError("");
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setServerError(data.error || "Failed to save"); return; }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setServerError("Network error. Please try again.");
        } finally { setLoading(false); }
    };

    const field = (key: keyof FormState, value: string) => {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
    };

    if (status === "loading" || fetchLoading) {
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
                <div className="max-w-2xl mx-auto px-4 sm:px-6">

                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-6">
                        <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
                        <ChevronRight size={13} />
                        <span className="text-[var(--text-secondary)]">My Profile</span>
                    </nav>

                    {/* Profile Header */}
                    <div className="flex items-center gap-4 mb-6 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                        <div className="w-14 h-14 rounded-full bg-[var(--brand)] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                            {session?.user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base font-bold text-[var(--text-primary)] truncate">{session?.user?.name}</h1>
                            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5 truncate">
                                <Mail size={12} className="shrink-0" /> {session?.user?.email}
                            </p>
                        </div>
                        <Link href="/orders"
                            className="ml-auto shrink-0 flex items-center gap-2 text-sm font-semibold text-[var(--brand)] bg-[hsl(214_89%_52%/0.08)] border border-[hsl(214_89%_52%/0.2)] px-3.5 py-2 rounded-lg hover:bg-[hsl(214_89%_52%/0.15)] transition-all">
                            <Package size={15} /> My Orders
                        </Link>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                            { label: "My Orders", href: "/orders", icon: Package, sub: "Track all orders" },
                            { label: "Browse Deals", href: "/products", icon: ShoppingBag, sub: "Find latest deals" },
                            { label: "Price Tracker", href: "/price-tracker", icon: MapPin, sub: "Set price alerts" },
                        ].map(item => (
                            <Link key={item.href} href={item.href}
                                className="flex flex-col items-center text-center gap-2 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-[var(--border-brand)] hover:bg-[hsl(214_89%_52%/0.04)] transition-all group">
                                <item.icon size={20} className="text-[var(--brand)] group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 hidden sm:block">{item.sub}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Address Form */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin size={18} className="text-[var(--brand)]" />
                            <h2 className="font-bold text-[var(--text-primary)] text-base">Saved Address</h2>
                            <span className="text-xs text-[var(--text-muted)] font-normal">(auto-fills at checkout)</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mb-5">All fields are required to enable quick checkout.</p>

                        {serverError && (
                            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                                <AlertCircle size={14} className="shrink-0" /> {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSave} noValidate className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                    <input
                                        type="text"
                                        autoComplete="name"
                                        value={form.name}
                                        onChange={e => field("name", e.target.value)}
                                        placeholder="Your full name"
                                        className={`input-base pl-9 w-full ${errors.name ? "border-red-500 focus:border-red-500" : ""}`}
                                    />
                                </div>
                                {errors.name && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                    Phone Number <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                    <input
                                        type="tel"
                                        autoComplete="tel"
                                        value={form.phone}
                                        onChange={e => field("phone", e.target.value.replace(/[^\d\s+\-()]/g, ""))}
                                        placeholder="10-digit mobile number"
                                        maxLength={13}
                                        className={`input-base pl-9 w-full ${errors.phone ? "border-red-500 focus:border-red-500" : ""}`}
                                    />
                                </div>
                                {errors.phone && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.phone}</p>}
                            </div>

                            {/* Street Address */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                    Street Address <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    autoComplete="street-address"
                                    value={form.address}
                                    onChange={e => field("address", e.target.value)}
                                    placeholder="Flat / House No, Building, Street, Area"
                                    className={`input-base w-full ${errors.address ? "border-red-500 focus:border-red-500" : ""}`}
                                />
                                {errors.address && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.address}</p>}
                            </div>

                            {/* City + State side by side */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                        City <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        autoComplete="address-level2"
                                        value={form.city}
                                        onChange={e => field("city", e.target.value)}
                                        placeholder="City"
                                        className={`input-base w-full ${errors.city ? "border-red-500 focus:border-red-500" : ""}`}
                                    />
                                    {errors.city && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.city}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                        State <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={form.state}
                                        onChange={e => field("state", e.target.value)}
                                        className={`input-base w-full ${errors.state ? "border-red-500 focus:border-red-500" : ""}`}
                                    >
                                        <option value="">Select state</option>
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.state && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.state}</p>}
                                </div>
                            </div>

                            {/* Pincode */}
                            <div className="max-w-[160px]">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                    Pincode <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="postal-code"
                                    value={form.pincode}
                                    onChange={e => field("pincode", e.target.value.replace(/\D/g, ""))}
                                    placeholder="6-digit"
                                    maxLength={6}
                                    className={`input-base w-full ${errors.pincode ? "border-red-500 focus:border-red-500" : ""}`}
                                />
                                {errors.pincode && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.pincode}</p>}
                            </div>

                            {/* Submit */}
                            <div className="flex items-center gap-3 pt-2">
                                <button type="submit" disabled={loading}
                                    className="flex items-center gap-2 btn-primary px-6 py-2.5 text-sm font-bold shine-on-hover disabled:opacity-60">
                                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                    Save Address
                                </button>
                                {saved && (
                                    <span className="flex items-center gap-1.5 text-sm text-green-500 font-semibold">
                                        <CheckCircle2 size={15} /> Saved successfully!
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
