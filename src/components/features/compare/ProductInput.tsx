'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Link, Zap } from 'lucide-react';

interface ProductInputProps {
    onCompare: (urls: string[]) => void;
    loading: boolean;
}

export default function ProductInput({ onCompare, loading }: ProductInputProps) {
    const [urls, setUrls] = useState<string[]>(['']);

    const addField = () => {
        if (urls.length < 5) {
            setUrls([...urls, '']);
        }
    };

    const removeField = (index: number) => {
        const newUrls = urls.filter((_, i) => i !== index);
        setUrls(newUrls.length ? newUrls : ['']);
    };

    const updateUrl = (index: number, val: string) => {
        const newUrls = [...urls];
        newUrls[index] = val;
        setUrls(newUrls);
    };

    const handleCompareClick = () => {
        const validUrls = urls.filter(u => u.trim() !== '');
        if (validUrls.length > 0) {
            onCompare(validUrls);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid gap-4 stagger-children">
                {urls.map((url, index) => (
                    <div key={index} className="flex gap-2 group items-center">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors">
                                <Link size={18} />
                            </div>
                            <input
                                type="url"
                                placeholder="Paste Amazon, Flipkart or Myntra link..."
                                className="input-base pl-10 h-12"
                                value={url}
                                onChange={(e) => updateUrl(index, e.target.value)}
                            />
                        </div>
                        {urls.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeField(index)}
                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                title="Remove link"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                    type="button"
                    onClick={addField}
                    disabled={urls.length >= 5}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-800/30 hover:bg-gray-800/50 text-gray-400 font-bold rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-all active:scale-[0.98] disabled:opacity-30"
                >
                    <Plus size={20} />
                    Add Platform Link
                </button>
                <button
                    type="button"
                    onClick={handleCompareClick}
                    disabled={loading || urls.every(u => !u.trim())}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] btn-glow"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Zap size={20} className="fill-current" />
                            Compare Now
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
