"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";

interface ProductGalleryProps {
    images: string[];
    title: string;
    primaryImage?: string | null;
}

export default function ProductGallery({ images, title, primaryImage }: ProductGalleryProps) {
    // Collect all unique images
    const allImages = Array.from(new Set([primaryImage, ...images].filter(Boolean) as string[]));
    const [mainImage, setMainImage] = useState<string | null>(allImages.length > 0 ? allImages[0] : null);

    return (
        <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* Thumbnails Sidebar */}
            {allImages.length > 1 && (
                <div className="flex md:flex-col gap-3 order-2 md:order-1 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0 hide-scroll">
                    {allImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setMainImage(img)}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md border-2 overflow-hidden transition-all bg-white ${
                                mainImage === img ? "border-[hsl(214_89%_52%)] scale-105" : "border-[var(--border)] opacity-70 hover:opacity-100"
                            }`}
                        >
                            <Image
                                src={img}
                                alt={`${title} preview ${idx + 1}`}
                                fill
                                className="object-contain p-1 mix-blend-multiply"
                                sizes="80px"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main Image */}
            <div className="relative flex-1 bg-white border border-[var(--border)] rounded-md aspect-square sm:aspect-auto sm:h-[500px] flex items-center justify-center overflow-hidden order-1 md:order-2">
                {mainImage ? (
                    <Image
                        src={mainImage}
                        alt={title}
                        fill
                        className="object-contain p-4 sm:p-8 mix-blend-multiply transition-opacity duration-300"
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                ) : (
                    <ShoppingCart size={80} className="text-[var(--text-placeholder)]" />
                )}
            </div>
        </div>
    );
}
