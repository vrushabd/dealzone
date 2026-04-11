"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", { email, password, redirect: false });
        setLoading(false);
        if (res?.error) {
            setError("Invalid email or password. Please try again.");
        } else {
            router.push("/admin");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-[hsl(224_44%_4%)] flex items-center justify-center p-4 relative overflow-hidden mesh-bg">
            {/* Animated background blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] animate-float pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] animate-[float_7s_ease-in-out_infinite_reverse] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(24_95%_53%/0.05),transparent_65%)] pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in-up relative z-10">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_hsl(24_95%_53%/0.4)] mx-auto">
                            <Zap size={30} className="text-white" fill="currentColor" />
                        </div>
                        {/* Glow ring */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-orange-500/30 scale-110 opacity-60 animate-[pulseGlow_2s_ease-in-out_infinite]" />
                    </div>
                    <h1 className="text-3xl font-extrabold gradient-text tracking-tight">DealZone</h1>
                    <p className="text-[hsl(215_12%_42%)] text-sm mt-1">Admin Dashboard</p>
                </div>

                {/* Card */}
                <div className="glass-strong rounded-2xl p-8 shadow-[0_24px_80px_hsl(224_44%_0%/0.6),0_0_0_1px_hsl(224_22%_22%/0.5)] relative overflow-hidden">
                    {/* Inner glow */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(24_95%_53%/0.4)] to-transparent" />

                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Lock size={16} className="text-orange-400" />
                        Sign In to Admin
                    </h2>

                    {error && (
                        <div className="bg-[hsl(0_84%_60%/0.1)] border border-[hsl(0_84%_60%/0.25)] text-[hsl(0_84%_70%)] rounded-xl px-4 py-3 text-sm mb-5 flex items-center gap-2 animate-scale-in">
                            <span className="w-2 h-2 rounded-full bg-[hsl(0_84%_60%)] flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-[hsl(215_15%_55%)] mb-1.5 uppercase tracking-wider">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(215_12%_40%)]" />
                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@dealzone.com"
                                    required
                                    className="input-base pl-10"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-[hsl(215_15%_55%)] mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(215_12%_40%)]" />
                                <input
                                    id="admin-password"
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="input-base pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215_12%_40%)] hover:text-[hsl(215_18%_65%)] transition-colors p-0.5"
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
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 btn-glow shine-on-hover flex items-center justify-center gap-2 mt-2 shadow-[0_4px_16px_hsl(24_95%_53%/0.3)]"
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

                    {/* Hint */}
                    <div className="mt-6 pt-5 border-t border-[hsl(224_20%_14%)] flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[hsl(215_12%_30%)]" />
                        <p className="text-[hsl(215_10%_38%)] text-xs">
                            Default: <span className="text-[hsl(215_15%_48%)]">admin@dealzone.com</span> / <span className="text-[hsl(215_15%_48%)]">admin123</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
