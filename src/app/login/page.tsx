"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("user-credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);
        if (res?.error) {
            setError("Invalid email or password. Please try again.");
        } else {
            router.push(callbackUrl);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo href="/" className="scale-125" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back!</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Sign in to track your orders & cart</p>
                </div>

                {/* Card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-7 shadow-[var(--shadow-elevated)]">
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
                            <AlertCircle size={16} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="input-base !pl-9"
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input-base pl-9 pr-10"
                                    placeholder="Your password"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button
                            id="login-submit-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 text-sm font-bold shine-on-hover btn-glow disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Sign In <ArrowRight size={16} />
                                </span>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[var(--text-muted)] mt-6">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-[hsl(214_89%_55%)] font-semibold hover:underline">
                            Create one free
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-[var(--text-muted)] mt-6">
                    <Link href="/admin/login" className="hover:text-[var(--text-secondary)] transition-colors">
                        Admin Login →
                    </Link>
                </p>
            </div>
        </div>
    );
}
