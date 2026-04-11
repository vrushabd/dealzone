'use client';

import React from 'react';

export function ComparisonSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col glass rounded-[2rem] border border-white/5 overflow-hidden h-[550px]">
                    <div className="h-64 skeleton rounded-none" />
                    <div className="p-6 space-y-4">
                        <div className="h-6 skeleton w-3/4" />
                        <div className="h-10 skeleton w-1/2" />
                        <div className="space-y-4 pt-4">
                            <div className="h-4 skeleton w-full" />
                            <div className="h-4 skeleton w-5/6" />
                        </div>
                        <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
                            <div className="h-14 skeleton rounded-2xl" />
                            <div className="h-14 skeleton rounded-2xl" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
