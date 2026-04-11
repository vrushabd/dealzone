'use client';

import React, { useEffect, useState } from 'react';
import { Bell, ArrowDown, ExternalLink, Trash2, Loader2, Tag } from 'lucide-react';

export default function TrackedPage() {
    const [tracked, setTracked] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would fetch based on session/email
        // For now, let's fetch all active tracks (mocking user context)
        const fetchTracked = async () => {
            try {
                const res = await fetch('/api/track/list'); // I'll need to create this simple list API
                const data = await res.json();
                setTracked(data);
            } catch (error) {
                console.error('Error fetching tracked products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTracked();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 pt-16">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tracked Products</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your price drop alerts and get the best deals.</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <Bell size={24} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-gray-500">Retrieving your deals...</p>
                    </div>
                ) : tracked.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <Tag className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products tracked yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Start by comparing products and clicking the "Track Price" button.</p>
                        <a href="/compare" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                            Go to Comparison
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {tracked.map((item, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                                <img src={item.product.image} className="w-20 h-20 object-contain" alt="" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.product.title}</h3>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-2xl font-black text-gray-900 dark:text-white">₹{item.product.price.toLocaleString()}</span>
                                        {item.targetPrice && (
                                            <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md font-bold">
                                                <ArrowDown size={14} />
                                                Target: ₹{item.targetPrice.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={item.product.amazonLink || item.product.flipkartLink}
                                        target="_blank"
                                        className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-blue-600 rounded-xl transition-colors"
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                    <button className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-red-500 rounded-xl transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
