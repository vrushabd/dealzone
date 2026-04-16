"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
        { role: 'assistant', content: "Hi! I'm your DealZone AI Assistant. I can help you find products, compare prices, or track deals. What are you looking for?" }
    ]);
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
            } else {
                setMessages([...newMessages, { role: 'assistant', content: `Error: ${data.error || 'Something went wrong.'}` }]);
            }
        } catch (error) {
            setMessages([...newMessages, { role: 'assistant', content: "Failed to connect to the AI. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl rounded-2xl w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[80vh] flex flex-col mb-4 overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-[var(--brand-glow)]/10 text-[var(--text-primary)] p-4 border-b border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="text-[var(--brand)]" size={20} />
                            <div>
                                <h3 className="font-bold text-sm">DealZone Assistant</h3>
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
                                    {/* Super simple markdown link parsing for relative links */}
                                    {msg.role === 'assistant' 
                                        ? msg.content.split('\n').map((line, i) => (
                                            <div key={i}>
                                                {line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:hsl(214 89% 65%); text-decoration:underline;">$1</a>')}
                                            </div>
                                        )) 
                                        : msg.content}
                                </div>
                            </div>
                        ))}
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
