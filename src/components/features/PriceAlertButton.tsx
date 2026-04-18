"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import PriceAlertModal from "./PriceAlertModal";

interface PriceAlertButtonProps {
    productId: string;
    currentPrice: number;
    productName: string;
}

export default function PriceAlertButton({ productId, currentPrice, productName }: PriceAlertButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 border border-[hsl(214_89%_55%/0.3)] bg-[hsl(214_89%_55%/0.05)] hover:bg-[hsl(214_89%_55%/0.15)] text-[var(--text-primary)] font-semibold py-3 px-6 rounded-md transition-all text-sm group"
            >
                <Bell size={18} className="text-[hsl(214_89%_55%)] group-hover:animate-swing" />
                Set Price Drop Alert
            </button>
            <PriceAlertModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productId={productId}
                currentPrice={currentPrice}
                productName={productName}
            />
        </>
    );
}
