"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Link from "next/link";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        fetch(`/api/analytics?userId=${user.id}`)
            .then((res) => res.json())
            .then((result) => {
                if (result.success) setData(result.analytics);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load analytics", err);
                setLoading(false);
            });
    }, [user?.id]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black text-white p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Analytics & Performance</h1>
                        <div className="flex gap-4">
                            <Link
                                href="/dashboard"
                                className="bg-zinc-800 px-4 py-2 rounded hover:bg-zinc-700 transition"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <p className="text-gray-400">Loading analytics...</p>
                        </div>
                    ) : !data ? (
                        <div className="bg-zinc-900 p-6 rounded-lg text-center">
                            <p className="text-gray-400">Failed to load analytics data.</p>
                        </div>
                    ) : (
                        <>
                            {/* Top Level Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                                <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                                    <p className="text-sm text-gray-400 font-medium mb-1">Total Calls</p>
                                    <h2 className="text-3xl font-bold">{data.totalCalls}</h2>
                                </div>
                                <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                                    <p className="text-sm text-gray-400 font-medium mb-1">Calls Today</p>
                                    <h2 className="text-3xl font-bold text-blue-400">{data.callsToday}</h2>
                                </div>
                                <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                                    <p className="text-sm text-gray-400 font-medium mb-1">Avg Duration</p>
                                    <h2 className="text-3xl font-bold">{data.avgDurationFormatted}</h2>
                                </div>
                                <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                                    <p className="text-sm text-gray-400 font-medium mb-1">Success Rate</p>
                                    <h2 className="text-3xl font-bold text-emerald-400">{data.successRate}%</h2>
                                </div>
                                <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                                    <p className="text-sm text-gray-400 font-medium mb-1">API Usage</p>
                                    <h2 className="text-3xl font-bold text-amber-400">{data.totalTokensUsed}</h2>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 mb-8">
                                <h3 className="text-lg font-semibold mb-6">Calls Over Time (Last 7 Days)</h3>
                                <div className="h-[300px] w-full">
                                    {data.callsOverTime && data.callsOverTime.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.callsOverTime}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#a1a1aa"
                                                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                                                    tickMargin={10}
                                                />
                                                <YAxis
                                                    stroke="#a1a1aa"
                                                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                                                    allowDecimals={false}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '4px' }}
                                                    itemStyle={{ color: '#60a5fa' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="calls"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                                    activeDot={{ r: 6, fill: '#60a5fa', strokeWidth: 0 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-500">
                                            Not enough data to display chart
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
