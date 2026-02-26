"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function AgentsPage() {
    const { user } = useAuth();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State for creating new agent
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [voice, setVoice] = useState("default");
    const [creating, setCreating] = useState(false);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("agents")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) console.error("Error fetching agents:", error);
            else setAgents(data || []);
        } catch (err) {
            console.error("Fetch agents error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchAgents();
    }, [user?.id]);

    const handleCreateAgent = async (e) => {
        e.preventDefault();
        if (!name.trim() || !systemPrompt.trim()) {
            return alert("Name and System Prompt are required.");
        }

        setCreating(true);
        try {
            const { data, error } = await supabase
                .from("agents")
                .insert([
                    {
                        name,
                        description,
                        system_prompt: systemPrompt,
                        voice,
                        user_id: user.id,
                        knowledge_base: "",
                    }
                ])
                .select();

            if (error) throw error;

            alert("Agent created successfully!");
            setName("");
            setDescription("");
            setSystemPrompt("");
            setVoice("default");
            fetchAgents();
        } catch (err) {
            console.error("Create agent error:", err);
            alert("Failed to create agent: " + err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this agent?")) return;

        try {
            const { error } = await supabase.from("agents").delete().eq("id", id);
            if (error) throw error;
            setAgents(agents.filter((a) => a.id !== id));
            alert("Agent deleted.");
        } catch (err) {
            console.error("Delete agent error:", err);
            alert("Failed to delete agent.");
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black text-white p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Agents Management</h1>
                        <Link
                            href="/dashboard"
                            className="bg-zinc-800 px-4 py-2 rounded hover:bg-zinc-700 transition"
                        >
                            Back to Dashboard
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Create Agent Form */}
                        <div className="md:col-span-1 bg-zinc-900 p-6 rounded-lg h-fit">
                            <h2 className="text-xl font-semibold mb-4 border-b border-zinc-800 pb-2">
                                Create New Agent
                            </h2>
                            <form onSubmit={handleCreateAgent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="E.g., Sales Assistant"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Short description..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        System Prompt *
                                    </label>
                                    <textarea
                                        required
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        rows={4}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="You are a helpful assistant..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        Voice
                                    </label>
                                    <select
                                        value={voice}
                                        onChange={(e) => setVoice(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="default">Default</option>
                                        <option value="rachel">Rachel</option>
                                        <option value="drew">Drew</option>
                                        <option value="clyde">Clyde</option>
                                        <option value="paul">Paul</option>
                                        <option value="domi">Domi</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition disabled:opacity-50"
                                >
                                    {creating ? "Creating..." : "Create Agent"}
                                </button>
                            </form>
                        </div>

                        {/* List of Agents */}
                        <div className="md:col-span-2 space-y-4">
                            <h2 className="text-xl font-semibold mb-4 border-b border-zinc-800 pb-2">
                                Your Agents
                            </h2>
                            {loading ? (
                                <p className="text-gray-400">Loading agents...</p>
                            ) : agents.length === 0 ? (
                                <div className="bg-zinc-900 p-6 rounded-lg text-center border-dashed border-2 border-zinc-700">
                                    <p className="text-gray-400">You haven&apos;t created any agents yet.</p>
                                </div>
                            ) : (
                                agents.map((agent) => (
                                    <div
                                        key={agent.id}
                                        className="bg-zinc-900 p-5 rounded-lg flex flex-col md:flex-row md:items-start justify-between gap-4 border border-zinc-800"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold">{agent.name}</h3>
                                                <span className="text-xs bg-zinc-800 text-gray-300 px-2 py-1 rounded">
                                                    {agent.voice || "default"} voice
                                                </span>
                                            </div>
                                            {agent.description && (
                                                <p className="text-sm text-gray-400 mb-3">
                                                    {agent.description}
                                                </p>
                                            )}

                                            <div className="mt-2 text-xs text-gray-500 line-clamp-2 italic bg-black p-2 rounded">
                                                &quot;{agent.system_prompt}&quot;
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col gap-2 min-w-[120px]">
                                            <Link
                                                href={`/agents/${agent.id}`}
                                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-center py-1.5 px-3 rounded text-sm transition"
                                            >
                                                Edit / Knowledge
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(agent.id)}
                                                className="flex-1 border border-red-900/50 text-red-400 hover:bg-red-900/20 py-1.5 px-3 rounded text-sm transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
