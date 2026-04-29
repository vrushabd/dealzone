"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface LogoProps {
    className?: string;
    href?: string;
    onClick?: () => void;
    // Optional SSR-passed props so there's no flash on first load
    siteName?: string;
    logoUrl?: string | null;
}

export default function Logo({ className = "", href = "/", onClick, siteName: initialName, logoUrl: initialLogo }: LogoProps) {
    const [siteName, setSiteName] = useState(initialName || "ZenCult");
    const [logoUrl, setLogoUrl] = useState<string | null>(initialLogo || null);

    useEffect(() => {
        // Only fetch if not provided via SSR props
        if (initialName && initialLogo !== undefined) return;
        fetch("/api/settings/public")
            .then((r) => r.json())
            .then((data) => {
                if (data.siteName) setSiteName(data.siteName);
                if (data.logoUrl !== undefined) setLogoUrl(data.logoUrl);
            })
            .catch(() => {});
    }, [initialName, initialLogo]);

    // Split site name for two-line display (first word + rest)
    const words = siteName.trim().split(/\s+/);
    const firstWord = words[0] || siteName;
    const restWords = words.slice(1).join(" ");

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-2.5 group flex-shrink-0 select-none ${className}`}
        >
            {/* Logo image or default SVG icon */}
            <div className="relative w-9 h-9 flex-shrink-0">
                {logoUrl ? (
                    <Image
                        src={logoUrl}
                        alt={siteName}
                        fill
                        className="object-contain rounded-md group-hover:scale-105 transition-transform duration-300"
                        sizes="36px"
                        unoptimized
                    />
                ) : (
                    <svg
                        viewBox="0 0 40 44"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full drop-shadow-[0_4px_12px_hsl(214_89%_52%/0.45)] group-hover:drop-shadow-[0_4px_20px_hsl(214_89%_52%/0.7)] transition-all duration-300"
                    >
                        <path d="M4 13h32l-3.2 26a2 2 0 01-1.98 1.7H9.18A2 2 0 017.2 39L4 13z" fill="url(#bagGradient)" />
                        <path d="M14 13c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="url(#handleGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        <path d="M14.5 26c1 3 2.5 5 5.5 5s4.5-2 5.5-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
                        <circle cx="16" cy="22" r="1.5" fill="white" opacity="0.9" />
                        <circle cx="24" cy="22" r="1.5" fill="white" opacity="0.9" />
                        <path d="M32 2l-3.5 5.5h2L27 14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                        <defs>
                            <linearGradient id="bagGradient" x1="4" y1="13" x2="36" y2="44" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="hsl(214, 89%, 48%)" />
                                <stop offset="100%" stopColor="hsl(214, 89%, 35%)" />
                            </linearGradient>
                            <linearGradient id="handleGradient" x1="14" y1="7" x2="26" y2="13" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="hsl(214, 89%, 55%)" />
                                <stop offset="100%" stopColor="hsl(214, 89%, 45%)" />
                            </linearGradient>
                        </defs>
                    </svg>
                )}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-[hsl(214_89%_55%/0.4)]" />
            </div>

            {/* Text */}
            <div className="flex flex-col justify-center leading-none">
                <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(214_89%_45%)] to-[hsl(214_89%_65%)] group-hover:from-[hsl(214_89%_55%)] group-hover:to-[hsl(214_89%_75%)] transition-all duration-300">
                    {firstWord}
                </span>
                {restWords && (
                    <span className="text-[11px] font-extrabold tracking-[0.12em] text-[hsl(214_89%_55%)] uppercase group-hover:text-[hsl(214_89%_65%)] transition-colors duration-300">
                        {restWords}
                    </span>
                )}
            </div>
        </Link>
    );
}
