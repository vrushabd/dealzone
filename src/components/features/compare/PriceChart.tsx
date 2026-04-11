'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface PriceChartProps {
    productId: string;
    data: any[];
}

export default function PriceChart({ data }: PriceChartProps) {
    // Format dates for display
    const chartData = data.map(item => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        }),
        priceValue: item.price
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis
                        dataKey="formattedDate"
                        stroke="#64748b"
                        fontSize={10}
                        fontWeight="bold"
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        fontWeight="bold"
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                        tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            borderRadius: '1rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'black' }}
                        formatter={(value) => [
                            `₹${value != null ? Number(value).toLocaleString() : '—'}`,
                            'Price',
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="priceValue"
                        stroke="#f97316"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#priceGradient)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
