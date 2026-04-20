"use client";

import { useState, useEffect } from "react";
import { Loader2, Key, Save, AlertCircle, CheckCircle, Globe, Image as ImageIcon } from "lucide-react";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Branding
    const [siteName, setSiteName] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [faviconUrl, setFaviconUrl] = useState("");

    // API Keys
    const [geminiApiKey, setGeminiApiKey] = useState("");
    const [amazonAffiliateTag, setAmazonAffiliateTag] = useState("");
    const [flipkartAffiliateId, setFlipkartAffiliateId] = useState("");
    const [resendApiKey, setResendApiKey] = useState("");

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch("/api/admin/settings");
                if (!res.ok) throw new Error("Failed to load settings");
                const data = await res.json();
                setSiteName(data.siteName || "GenzLoots");
                setLogoUrl(data.logoUrl || "");
                setFaviconUrl(data.faviconUrl || "");
                setGeminiApiKey(data.geminiApiKey || "");
                setAmazonAffiliateTag(data.amazonAffiliateTag || "");
                setFlipkartAffiliateId(data.flipkartAffiliateId || "");
                setResendApiKey(data.resendApiKey || "");
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
        if (!siteName.trim()) {
            setError("Site name cannot be empty.");
            return;
        }
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    siteName: siteName.trim(),
                    logoUrl: logoUrl.trim(),
                    faviconUrl: faviconUrl.trim(),
                    geminiApiKey: geminiApiKey.trim(),
                    amazonAffiliateTag: amazonAffiliateTag.trim(),
                    flipkartAffiliateId: flipkartAffiliateId.trim(),
                    resendApiKey: resendApiKey.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save settings");

            setSuccess("Settings saved! Site name and favicon changes take effect on next page load.");
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

            {/* ── Branding Section ─────────────────────────────────── */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[var(--border)] border-l-4 border-l-[hsl(214_89%_52%)]">
                    <div className="flex items-center gap-2 mb-1">
                        <Globe size={18} className="text-[hsl(214_89%_52%)]" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Site Branding</h2>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Changing the site name updates the browser tab title, email headers, and Logo text across the entire website.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Site Name */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                            Site Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="GenzLoots"
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            className="input-base w-full max-w-sm"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1.5">
                            Appears in browser tab title, email subject lines, and the logo text.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo URL */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                                <ImageIcon size={14} className="text-[var(--text-muted)]" /> Logo Image URL
                            </label>
                            <input
                                type="url"
                                placeholder="https://yoursite.com/logo.png"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                className="input-base w-full text-sm"
                            />
                            {logoUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logoUrl} alt="Logo preview" className="mt-2 h-10 w-auto object-contain rounded border border-[var(--border)] p-1 bg-[var(--bg-elevated)]" onError={(e) => (e.currentTarget.style.display = "none")} />
                            )}
                            <p className="text-xs text-[var(--text-muted)] mt-1.5">
                                Replaces the default SVG shopping bag icon. Leave blank to use default.
                            </p>
                        </div>

                        {/* Favicon URL */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                                <ImageIcon size={14} className="text-[var(--text-muted)]" /> Favicon URL
                            </label>
                            <input
                                type="url"
                                placeholder="https://yoursite.com/favicon.ico"
                                value={faviconUrl}
                                onChange={(e) => setFaviconUrl(e.target.value)}
                                className="input-base w-full text-sm"
                            />
                            {faviconUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={faviconUrl} alt="Favicon preview" className="mt-2 h-8 w-8 object-contain rounded border border-[var(--border)] p-0.5 bg-[var(--bg-elevated)]" onError={(e) => (e.currentTarget.style.display = "none")} />
                            )}
                            <p className="text-xs text-[var(--text-muted)] mt-1.5">
                                16×16 or 32×32 .ico / .png. Leave blank to use default SVG.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── API Keys Section ─────────────────────────────────── */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[var(--border)] border-l-4 border-l-[hsl(214_89%_52%)]">
                    <div className="flex items-center gap-2 mb-1">
                        <Key size={18} className="text-[hsl(214_89%_52%)]" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">AI API Configuration</h2>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                        The Gemini API key powers the chatbot. If left blank, the app uses the local <code className="text-xs bg-[var(--bg-elevated)] px-1 py-0.5 rounded">.env</code> configuration.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Gemini AI Key */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                            Google Gemini API Key
                        </label>
                        <input
                            type="password"
                            placeholder="AIzaSy..."
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            className="input-base w-full max-w-lg font-mono text-sm"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1.5">
                            Get your key from Google AI Studio. Never share this key publicly.
                        </p>
                    </div>

                    <hr className="border-[var(--border)]" />

                    {/* Affiliate Links */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Affiliate Configurations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Amazon Affiliate Tag</label>
                                <input
                                    type="text"
                                    placeholder="yourtag-21"
                                    value={amazonAffiliateTag}
                                    onChange={(e) => setAmazonAffiliateTag(e.target.value)}
                                    className="input-base w-full text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Flipkart Affiliate ID</label>
                                <input
                                    type="text"
                                    placeholder="yourfkrtid"
                                    value={flipkartAffiliateId}
                                    onChange={(e) => setFlipkartAffiliateId(e.target.value)}
                                    className="input-base w-full text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-[var(--border)]" />

                    {/* Resend Email API */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Email Notifications (Resend)</h3>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Resend API Key</label>
                            <input
                                type="password"
                                placeholder="re_..."
                                value={resendApiKey}
                                onChange={(e) => setResendApiKey(e.target.value)}
                                className="input-base w-full max-w-lg font-mono text-sm"
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-1.5">
                                Used for sending Price Drop Alert emails to users.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-elevated)] px-6 py-4 border-t border-[var(--border)] flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] text-white font-semibold px-6 py-2.5 rounded-md transition-all btn-glow text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save All Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
