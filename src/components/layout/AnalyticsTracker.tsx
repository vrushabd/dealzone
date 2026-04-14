"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker() {
    const pathname = usePathname();
    const hasTrackedInitial = useRef(false);

    useEffect(() => {
        // Prevent double tracking in React Strict Mode locally
        if (!hasTrackedInitial.current && pathname === "/") {
            hasTrackedInitial.current = true;
        }

        // Initialize session ID if it doesn't exist
        let sessionId = "";
        try {
            sessionId = sessionStorage.getItem("dz_session_id") || "";
            if (!sessionId) {
                sessionId = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
                sessionStorage.setItem("dz_session_id", sessionId);
            }
        } catch {
            // Fallback for strict tracking blockers
            sessionId = "sess_anon_" + Math.random().toString(36).substring(2, 15);
        }

        // Only track non-admin pages
        if (pathname && !pathname.startsWith('/admin')) {
            fetch("/api/analytics/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: pathname,
                    sessionId: sessionId,
                }),
                // use keepalive to ensure request completes even if navigating away quickly
                keepalive: true,
            }).catch(() => {
                // Ignore analytics failures silently
            });
        }
    }, [pathname]);

    return null; // Silent tracker
}
