"use client";

import { useState, useEffect } from "react";
import { Loader2, Key, Save, AlertCircle, CheckCircle, Globe, Image as ImageIcon, CreditCard, Bug } from "lucide-react";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Branding
    const [siteName, setSiteName] = useState("");
    const [siteTagline, setSiteTagline] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [faviconUrl, setFaviconUrl] = useState("");

    // API Keys
    const [geminiApiKey, setGeminiApiKey] = useState("");
    const [resendApiKey, setResendApiKey] = useState("");
    const [scrapingBeeApiKey, setScrapingBeeApiKey] = useState("");
    const [razorpayKeyId, setRazorpayKeyId] = useState("");
    const [razorpayKeySecret, setRazorpayKeySecret] = useState("");

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch("/api/admin/settings");
                if (!res.ok) throw new Error("Failed to load settings");
                const data = await res.json();
                setSiteName(data.siteName || "GenzLoots");
                setSiteTagline(data.siteTagline || "");
                setLogoUrl(data.logoUrl || "");
                setFaviconUrl(data.faviconUrl || "");
                setGeminiApiKey(data.geminiApiKey || "");
                setResendApiKey(data.resendApiKey || "");
                setScrapingBeeApiKey(data.scrapingBeeApiKey || "");
                setRazorpayKeyId(data.razorpayKeyId || "");
                setRazorpayKeySecret(data.razorpayKeySecret || "");
            } catch (err) {
                console.error(err);
                setError("Could not load current settings.");
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!siteName.trim()) { setError("Site name cannot be empty."); return; }
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    siteName: siteName.trim(),
                    siteTagline: siteTagline.trim(),
                    logoUrl: logoUrl.trim(),
                    faviconUrl: faviconUrl.trim(),
                    geminiApiKey: geminiApiKey.trim(),
                    resendApiKey: resendApiKey.trim(),
                    scrapingBeeApiKey: scrapingBeeApiKey.trim(),
                    razorpayKeyId: razorpayKeyId.trim(),
                    razorpayKeySecret: razorpayKeySecret.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save settings");

            setSuccess("Settings saved successfully!");
            setTimeout(() => setSuccess(""), 5000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-[var(--text-muted)]">
                <Loader2 size={24} className="animate-spin" />
            </div>
        );
    }

    const sectionHeader = (icon: React.ReactNode, title: string, desc: string) => (
        <div className="p-5 border-b border-[var(--border)] border-l-4 border-l-[hsl(214_89%_52%)]">
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
        </div>
    );

    return (
        <div className="animate-fade-in-up max-w-4xl space-y-6">
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Site Settings</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">
                    Manage global platform settings, branding, and API integrations.
                </p>
            </div>

            {/* Status Alerts */}
            {(error || success) && (
                <div className="space-y-3">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm px-4 py-3 rounded-md flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm px-4 py-3 rounded-md flex items-center gap-2">
                            <CheckCircle size={16} /> {success}
                        </div>
                    )}
                </div>
            )}

            {/* ── Branding ── */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                {sectionHeader(<Globe size={18} className="text-[hsl(214_89%_52%)]" />, "Site Branding", "Changing the site name updates the browser tab title, email headers, and Logo text across the entire website.")}
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Site Name <span className="text-red-400">*</span></label>
                        <input type="text" placeholder="GenzLoots" value={siteName} onChange={e => setSiteName(e.target.value)} className="input-base w-full max-w-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Tagline</label>
                        <input type="text" placeholder="Best deals in India" value={siteTagline} onChange={e => setSiteTagline(e.target.value)} className="input-base w-full max-w-lg" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5"><ImageIcon size={14} className="text-[var(--text-muted)]" /> Logo Image URL</label>
                            <input type="url" placeholder="https://yoursite.com/logo.png" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="input-base w-full text-sm" />
                            {logoUrl && <img src={logoUrl} alt="Logo preview" className="mt-2 h-10 w-auto object-contain rounded border border-[var(--border)] p-1 bg-[var(--bg-elevated)]" onError={e => (e.currentTarget.style.display = "none")} />}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5"><ImageIcon size={14} className="text-[var(--text-muted)]" /> Favicon URL</label>
                            <input type="url" placeholder="https://yoursite.com/favicon.ico" value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} className="input-base w-full text-sm" />
                            {faviconUrl && <img src={faviconUrl} alt="Favicon preview" className="mt-2 h-8 w-8 object-contain rounded border border-[var(--border)] p-0.5 bg-[var(--bg-elevated)]" onError={e => (e.currentTarget.style.display = "none")} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── AI + Email Keys ── */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                {sectionHeader(<Key size={18} className="text-[hsl(214_89%_52%)]" />, "AI & Email API Keys", "Used for the chatbot (Gemini) and email notifications (Resend). Overrides the .env fallback.")}
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Google Gemini API Key</label>
                        <input type="password" placeholder="AIzaSy..." value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} className="input-base w-full max-w-lg font-mono text-sm" />
                        <p className="text-xs text-[var(--text-muted)] mt-1.5">Get from <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Resend API Key</label>
                        <input type="password" placeholder="re_..." value={resendApiKey} onChange={e => setResendApiKey(e.target.value)} className="input-base w-full max-w-lg font-mono text-sm" />
                        <p className="text-xs text-[var(--text-muted)] mt-1.5">Used for order confirmation and price-drop alert emails.</p>
                    </div>
                </div>
            </div>

            {/* ── Scraping ── */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                {sectionHeader(<Bug size={18} className="text-[hsl(214_89%_52%)]" />, "Scraping (Meesho)", "ScrapingBee bypasses Meesho's anti-bot protection. Get a key at scrapingbee.com.")}
                <div className="p-6">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">ScrapingBee API Key</label>
                    <input type="password" placeholder="U3ZFC..." value={scrapingBeeApiKey} onChange={e => setScrapingBeeApiKey(e.target.value)} className="input-base w-full max-w-lg font-mono text-sm" />
                    <p className="text-xs text-[var(--text-muted)] mt-1.5">Overrides the <code className="bg-[var(--bg-elevated)] px-1 rounded">SCRAPINGBEE_API_KEY</code> env variable.</p>
                </div>
            </div>

            {/* ── Razorpay ── */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                {sectionHeader(<CreditCard size={18} className="text-[hsl(214_89%_52%)]" />, "Razorpay Payment Gateway", "Keys used for processing online payments. Use live keys in production.")}
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Razorpay Key ID</label>
                        <input type="text" placeholder="rzp_live_..." value={razorpayKeyId} onChange={e => setRazorpayKeyId(e.target.value)} className="input-base w-full max-w-lg font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Razorpay Key Secret</label>
                        <input type="password" placeholder="••••••••••••••••••••••••" value={razorpayKeySecret} onChange={e => setRazorpayKeySecret(e.target.value)} className="input-base w-full max-w-lg font-mono text-sm" />
                        <p className="text-xs text-[var(--text-muted)] mt-1.5">Get from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="underline">Razorpay Dashboard → API Keys</a>.</p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pb-6">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] text-white font-semibold px-8 py-2.5 rounded-md transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save All Settings
                </button>
            </div>
        </div>
    );
}
