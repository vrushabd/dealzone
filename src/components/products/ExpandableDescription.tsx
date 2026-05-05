"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ExpandableDescription({ text }: { text: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Roughly 300 characters or 4 lines is a good threshold for "too long"
    const isLong = text.length > 350 || text.split('\n').length > 6;

    return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-5">
            <h2 className="font-semibold text-[var(--text-secondary)] mb-3">About this product</h2>
            
            <div className={`relative ${!isExpanded && isLong ? "max-h-40 overflow-hidden" : ""}`}>
                <p className="text-[var(--text-secondary)]/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {text}
                </p>
                
                {!isExpanded && isLong && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--bg-surface)] to-transparent pointer-events-none" />
                )}
            </div>

            {isLong && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 flex items-center gap-1 text-[hsl(214_89%_55%)] text-sm font-semibold hover:text-[hsl(214_89%_62%)] transition-colors"
                >
                    {isExpanded ? (
                        <>View Less <ChevronUp size={16} /></>
                    ) : (
                        <>View More <ChevronDown size={16} /></>
                    )}
                </button>
            )}
        </div>
    );
}
