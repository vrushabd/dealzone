"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function Stars({ rating }: { rating: number }) {
    const rounded = Math.max(0, Math.min(5, Math.round(rating * 2) / 2));
    const full = Math.floor(rounded);
    const half = rounded - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: full }).map((_, i) => (
                <span key={`f-${i}`} className="text-[hsl(45_93%_55%)] text-xs">★</span>
            ))}
            {half ? <span className="text-[hsl(45_93%_55%)] text-xs">⯪</span> : null}
            {Array.from({ length: empty }).map((_, i) => (
                <span key={`e-${i}`} className="text-[var(--text-muted)] text-xs">★</span>
            ))}
            <span className="ml-1 text-[10px] font-semibold text-[var(--text-muted)]">
                {rounded.toFixed(1)}
            </span>
        </div>
    );
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
        { role: 'assistant', content: "Hi! I'm your GenzLoots AI Assistant. I can help you find products, compare prices, or track deals. What are you looking for?" }
    ]);
    const [suggestedProducts, setSuggestedProducts] = useState<Array<{
        id: string;
        title: string;
        slug: string;
        image: string | null;
        price: number | null;
        originalPrice: number | null;
        rating?: number | null;
        category: string | null;
        href: string;
    }>>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const newMessages = [...messages, { role: 'user' as const, content: trimmed }];
        setMessages(newMessages);
        setSuggestedProducts([]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            });

            const data = await res.json();
            
            if (res.ok) {
                setMessages([...newMessages, { role: 'assistant', content: data.message }]);
                if (Array.isArray(data.products)) {
                    setSuggestedProducts(data.products.slice(0, 4));
                }
            } else {
                const friendly =
                    res.status === 429
                        ? (data?.error || "AI is busy right now. Please try again in a minute.")
                        : (data?.error || "Something went wrong.");
                setMessages([...newMessages, { role: 'assistant', content: `Error: ${friendly}` }]);
            }
        } catch {
            setMessages([...newMessages, { role: 'assistant', content: "Failed to connect to the AI. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderAssistantText = (text: string) => {
        const escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        const withLinks = escaped.replace(
            /\[(.*?)\]\((.*?)\)/g,
            (match, label, url) => {
                const isSafe = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('#');
                if (!isSafe) return label; // Return just the label as plain text if URL is suspicious
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[hsl(214_89%_65%)] underline underline-offset-2 break-words">${label}</a>`;
            }
        );

        return withLinks
            .split("\n")
            .map((line) => `<div>${line || "&nbsp;"}</div>`)
            .join("");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl rounded-2xl w-[360px] sm:w-[380px] max-w-[calc(100vw-1.5rem)] h-[520px] max-h-[80vh] flex flex-col mb-4 overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-[var(--brand-glow)]/10 text-[var(--text-primary)] p-4 border-b border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="text-[var(--brand)]" size={20} />
                            <div>
                                <h3 className="font-bold text-sm">GenzLoots Assistant</h3>
                                <span className="text-[10px] text-[var(--brand)] font-bold uppercase tracking-widest">AI Powered</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[hsl(214_89%_52%)] text-white' : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--brand)]'}`}>
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[hsl(214_89%_52%)] text-white rounded-tr-none' : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none leading-relaxed'}`}>
                                    {msg.role === 'assistant'
                                        ? <div dangerouslySetInnerHTML={{ __html: renderAssistantText(msg.content) }} />
                                        : msg.content}
                                </div>
                            </div>
                        ))}

                        {suggestedProducts.length > 0 && (
                            <div className="self-start w-full">
                                <div className="grid grid-cols-1 gap-2">
                                    {suggestedProducts.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]"
                                        >
                                            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
                                                {p.image ? (
                                                    <Image
                                                        src={p.image}
                                                        alt={p.title}
                                                        fill
                                                        sizes="56px"
                                                        className="object-contain p-1"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold text-[var(--text-primary)] line-clamp-2">
                                                    {p.title}
                                                </div>
                                                {typeof p.rating === "number" && p.rating > 0 ? (
                                                    <div className="mt-1">
                                                        <Stars rating={p.rating} />
                                                    </div>
                                                ) : null}
                                                <div className="mt-1 flex items-center gap-2">
                                                    {typeof p.price === "number" && p.price > 0 ? (
                                                        <div className="text-sm font-extrabold text-[hsl(214_89%_55%)]">
                                                            ₹{p.price.toLocaleString("en-IN")}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-[var(--text-muted)]">Check store</div>
                                                    )}
                                                    {typeof p.originalPrice === "number" && typeof p.price === "number" && p.originalPrice > p.price ? (
                                                        <div className="text-[10px] text-[var(--text-muted)] line-through">
                                                            ₹{p.originalPrice.toLocaleString("en-IN")}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <div className="mt-2 flex gap-2">
                                                    <Link
                                                        href={p.href}
                                                        className="inline-flex items-center justify-center px-4 py-1.5 rounded-md bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] text-white text-xs font-bold transition-colors shadow-md shadow-[hsl(214_89%_52%)]/20 animate-pulse"
                                                    >
                                                        Buy Now! ⚡️
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex gap-3 max-w-[85%] self-start">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
                                    <Bot size={14} />
                                </div>
                                <div className="p-4 rounded-2xl rounded-tl-none bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 border-t border-[var(--border)] bg-[var(--bg-surface)] flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-[var(--bg-base)] border border-[var(--border)] rounded-full px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] transition-colors"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !input.trim()}
                            className="w-10 h-10 rounded-full bg-[hsl(214_89%_52%)] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[hsl(214_89%_45%)] transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isOpen ? 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]' : 'bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] text-white'}`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
}
