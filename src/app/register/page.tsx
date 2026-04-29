"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function RegisterPage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/user-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed");
                return;
            }

            setSuccess(true);
            // Auto sign-in after registration
            await signIn("user-credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            });
            setTimeout(() => router.push("/"), 1500);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo href="/" className="scale-125" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Shop smarter with exclusive deals</p>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-7 shadow-[var(--shadow-elevated)]">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <CheckCircle2 size={28} className="text-green-500" />
                            </div>
                            <h2 className="font-bold text-[var(--text-primary)] text-lg">Account created!</h2>
                            <p className="text-sm text-[var(--text-secondary)]">Signing you in automatically...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
                                    <AlertCircle size={16} className="flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full Name</label>
                                        <div className="relative">
                                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                            <input id="reg-name" type="text" value={form.name} onChange={e => update("name", e.target.value)}
                                                className="input-base !pl-9" placeholder="Your full name" required autoComplete="name" />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email Address</label>
                                        <div className="relative">
                                            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                            <input id="reg-email" type="email" value={form.email} onChange={e => update("email", e.target.value)}
                                                className="input-base !pl-9" placeholder="you@example.com" required autoComplete="email" />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Phone Number <span className="text-[var(--text-muted)]">(optional)</span></label>
                                        <div className="relative">
                                            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                            <input id="reg-phone" type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
                                                className="input-base !pl-9" placeholder="+91 98765 43210" autoComplete="tel" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
                                        <div className="relative">
                                            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                            <input id="reg-password" type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)}
                                                className="input-base pl-9 pr-9" placeholder="Min 6 chars" required autoComplete="new-password" />
                                            <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Confirm</label>
                                        <div className="relative">
                                            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                            <input id="reg-confirm-password" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)}
                                                className="input-base !pl-9" placeholder="Repeat password" required autoComplete="new-password" />
                                        </div>
                                    </div>
                                </div>

                                <button id="register-submit-btn" type="submit" disabled={loading}
                                    className="w-full btn-primary py-3 text-sm font-bold shine-on-hover btn-glow disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating account...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            Create Account <ArrowRight size={16} />
                                        </span>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-sm text-[var(--text-muted)] mt-5">
                                Already have an account?{" "}
                                <Link href="/login" className="text-[hsl(214_89%_55%)] font-semibold hover:underline">Sign in</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
