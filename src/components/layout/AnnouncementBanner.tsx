"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UilMultiply, UilMegaphone } from "@iconscout/react-unicons";

export default function AnnouncementBanner() {
    const [text, setText] = useState<string | null>(null);
    const [link, setLink] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if dismissed in this session
        const isDismissed = sessionStorage.getItem("announcement_dismissed");
        if (isDismissed) return;

        fetch("/api/settings/public")
            .then(r => r.json())
            .then(d => {
                if (d.announcementText) {
                    setText(d.announcementText);
                    setLink(d.announcementLink || null);
                    setVisible(true);
                }
            })
            .catch(() => {});
    }, []);

    const dismiss = () => {
        setVisible(false);
        sessionStorage.setItem("announcement_dismissed", "1");
        setTimeout(() => setDismissed(true), 400);
    };

    if (dismissed || !text) return null;

    const content = (
        <span className="flex items-center gap-2 justify-center text-center">
            <UilMegaphone size={14} className="flex-shrink-0 opacity-80" />
            <span>{text}</span>
            {link && <span className="underline underline-offset-2 font-bold opacity-90 ml-1">→</span>}
        </span>
    );

    return (
        <div
            className={`relative w-full transition-all duration-400 ease-in-out overflow-hidden ${
                visible ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
            }`}
            style={{ background: "linear-gradient(90deg, hsl(214 89% 28%), hsl(214 89% 40%), hsl(214 89% 28%))" }}
        >
            <div className="relative px-10 py-2 text-white text-xs sm:text-sm font-medium">
                {link ? (
                    <Link href={link} className="block w-full hover:opacity-90 transition-opacity">
                        {content}
                    </Link>
                ) : (
                    <div className="w-full">{content}</div>
                )}

                {/* Dismiss button */}
                <button
                    onClick={dismiss}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                    aria-label="Dismiss"
                >
                    <UilMultiply size={14} />
                </button>
            </div>

            {/* Subtle shimmer animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/8 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
            </div>
        </div>
    );
}
