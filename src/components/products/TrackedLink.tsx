"use client";
import React from "react";

interface Props {
  productId: string;
  platform: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function TrackedLink({ productId, platform, href, children, className }: Props) {
  const handleClick = async () => {
    try {
      fetch("/api/analytics/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          platform,
          sessionId: sessionStorage.getItem("dz_session_id") || localStorage.getItem("genzloots_session") || "unknown",
        }),
      });
    } catch (err) {
      console.error("Click tracking failed:", err);
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
