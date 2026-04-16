"use client";

import { useState } from "react";
import { Bell, X, CheckCircle } from "lucide-react";

interface PriceAlertModalProps {
    productId: string;
    currentPrice: number;
    productName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function PriceAlertModal({ productId, currentPrice, productName, isOpen, onClose }: PriceAlertModalProps) {
    const [email, setEmail] = useState("");
    const [targetPrice, setTargetPrice] = useState(Math.round(currentPrice * 0.9)); // Default to 10% off
    const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        
        setStatus('loading');
        try {
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, email, targetPrice })
            });
            if (res.ok) setStatus('success');
            else setStatus('error');
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl rounded-xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    <X size={20} />
                </button>
                
                <div className="flex items-center gap-3 mb-4 text-[hsl(214_89%_55%)]">
                    <Bell size={24} />
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Set Price Alert</h2>
                </div>
                
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                    We'll email you immediately when the price of <span className="font-semibold text-[var(--text-primary)]">"{productName}"</span> drops below your target!
                </p>

                {status === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg flex items-center gap-3">
                        <CheckCircle size={24} className="flex-shrink-0" />
                        <p className="text-sm font-medium">Alert set! We'll notify {email} when the price drops to ₹{targetPrice}.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Target Price (₹)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">₹</span>
                                <input 
                                    type="number" 
                                    required
                                    min="1"
                                    max={currentPrice - 1}
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md pl-8 pr-4 py-2 focus:border-[hsl(214_89%_55%)] focus:outline-none transition-colors text-[var(--text-primary)] font-bold text-lg"
                                />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Current price: ₹{currentPrice.toLocaleString("en-IN")}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-2 focus:border-[hsl(214_89%_55%)] focus:outline-none transition-colors text-[var(--text-primary)]"
                            />
                        </div>

                        {status === 'error' && (
                            <p className="text-red-500 text-xs text-center">Failed to save alert. Please try again.</p>
                        )}

                        <button 
                            type="submit" 
                            disabled={status === 'loading'}
                            className="w-full flex items-center justify-center gap-2 bg-[hsl(214_89%_52%)] hover:bg-[hsl(214_89%_45%)] text-white font-bold py-3 px-4 rounded-md transition-all disabled:opacity-50"
                        >
                            <Bell size={18} />
                            {status === 'loading' ? 'Saving...' : 'Set Alert'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
