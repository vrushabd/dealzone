"use client";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function Logo({ className = "", href = "/", onClick }: { className?: string, href?: string, onClick?: () => void }) {
    return (
        <Link 
            href={href} 
            onClick={onClick}
            className={`flex items-center gap-2 group flex-shrink-0 ${className}`}
        >
            {/* Catchy Icon Box */}
            <div className="relative w-9 h-9 flex-shrink-0 perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-cyan-400 to-emerald-400 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] group-hover:rotate-6 transition-all duration-300 ease-out" />
                <div className="absolute inset-[2px] bg-[var(--bg-base)] rounded-[10px] z-10 flex items-center justify-center overflow-hidden">
                    {/* Inner glowing effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-cyan-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Zap 
                        size={18} 
                        className="text-cyan-500 fill-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 z-20" 
                    />
                </div>
            </div>

            {/* Typography */}
            <div className="flex flex-col justify-center -space-y-1">
                <span className="text-xl sm:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 group-hover:from-emerald-400 group-hover:via-cyan-400 group-hover:to-blue-500 transition-all duration-500 ease-in-out bg-[length:200%_auto]">
                    GENZ
                </span>
                <span className="text-[10px] sm:text-xs font-extrabold tracking-[0.25em] text-[var(--text-muted)] uppercase pl-0.5 group-hover:text-[var(--text-primary)] transition-colors duration-300">
                    Loots.
                </span>
            </div>
        </Link>
    );
}
