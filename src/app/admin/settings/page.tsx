"use client";

import { useState, useEffect } from "react";
import { Loader2, Key, Save, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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
        setSaving(true);
        setError("");
        setSuccess("");
        
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    geminiApiKey: geminiApiKey.trim(),
                    amazonAffiliateTag: amazonAffiliateTag.trim(),
                    flipkartAffiliateId: flipkartAffiliateId.trim(),
                    resendApiKey: resendApiKey.trim(),
                }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save settings");
            
            setSuccess("Settings updated successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
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
        <div className="animate-fade-in-up max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Site Settings</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">
                    Manage global platform settings and API integrations.
                </p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--border)] border-l-4 border-l-[hsl(214_89%_52%)]">
                    <div className="flex items-center gap-2 mb-1">
                        <Key size={18} className="text-[hsl(214_89%_52%)]" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">AI API Configuration</h2>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                        The Gemini API key is used to power the GenzLoots chatbot. 
                        If left blank, the application will attempt to use the local `.env` configuration.
                    </p>
                </div>

                <div className="p-6 space-y-8">
                    {/* Status Alerts */}
                    {(error || success) && (
                        <div className="space-y-3">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm px-4 py-3 rounded-md flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm px-4 py-3 rounded-md flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {success}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gemini AI Key */}
                    <div className="space-y-4">
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
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                            You can get your API key from Google AI Studio. 
                            Never share this key publicly.
                        </p>
                    </div>

                    <hr className="border-[var(--border)]" />

                    {/* Affiliate Links */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Affiliate Configurations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                                    Amazon Affiliate Tag
                                </label>
                                <input
                                    type="text"
                                    placeholder="yourtag-21"
                                    value={amazonAffiliateTag}
                                    onChange={(e) => setAmazonAffiliateTag(e.target.value)}
                                    className="input-base w-full text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                                    Flipkart Affiliate ID
                                </label>
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
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                                Resend API Key
                            </label>
                            <input
                                type="password"
                                placeholder="re_..."
                                value={resendApiKey}
                                onChange={(e) => setResendApiKey(e.target.value)}
                                className="input-base w-full max-w-lg font-mono text-sm"
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-2">
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
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
