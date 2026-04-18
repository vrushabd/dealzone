"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", { email, password, redirect: false });
        setLoading(false);
        if (res?.error) {
            setError("Invalid email or password. Please try again.");
        } else {
            const callbackUrl = searchParams.get("callbackUrl") || "/admin";
            router.push(callbackUrl);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[hsl(214_89%_52%/0.06)] rounded-full blur-[100px] animate-float pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[hsl(149_100%_33%/0.05)] rounded-full blur-[80px] animate-[float_7s_ease-in-out_infinite_reverse] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(214_89%_52%/0.04),transparent_65%)] pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in-up relative z-10">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[hsl(214_89%_52%)] to-[hsl(214_89%_40%)] rounded-md flex items-center justify-center shadow-[0_0_40px_hsl(214_89%_52%/0.35)] mx-auto">
                            <Zap size={30} className="text-white" fill="currentColor" />
                        </div>
                        {/* Glow ring */}
                        <div className="absolute inset-0 rounded-md border-2 border-[hsl(214_89%_52%/0.30)] scale-110 opacity-60 animate-[pulseGlow_2s_ease-in-out_infinite]" />
                    </div>
                    <h1 className="text-3xl font-extrabold gradient-text tracking-tight">DealZone</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Admin Dashboard</p>
                </div>

                {/* Card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-elevated)] relative overflow-hidden">
                    {/* Inner glow */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(24_95%_53%/0.4)] to-transparent" />

                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <Lock size={16} className="text-[var(--brand)]" />
                        Sign In to Admin
                    </h2>

                    {error && (
                        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] rounded-xl px-4 py-3 text-sm mb-5 flex items-center gap-2 animate-scale-in">
                            <span className="w-2 h-2 rounded-full bg-[var(--danger)] flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@gmail.com"
                                    required
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[hsl(214_89%_52%)] focus:shadow-[0_0_0_3px_hsl(214_89%_52%/0.15)] rounded-md pl-10 pr-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    id="admin-password"
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[hsl(214_89%_52%)] focus:shadow-[0_0_0_3px_hsl(214_89%_52%/0.15)] rounded-md pl-10 pr-10 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-0.5"
                                >
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="admin-login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-dim)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200 shine-on-hover flex items-center justify-center gap-2 mt-2 shadow-[var(--shadow-brand)]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}
