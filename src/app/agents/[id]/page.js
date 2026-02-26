"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AgentDetailPage({ params }) {
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;
    const { user } = useAuth();
    const router = useRouter();

    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [voice, setVoice] = useState("default");
    const [knowledgeBase, setKnowledgeBase] = useState("");

    // Upload State
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!user?.id || !id) return;

        const fetchAgent = async () => {
            try {
                const { data, error } = await supabase
                    .from("agents")
                    .select("*")
                    .eq("id", id)
                    .eq("user_id", user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setAgent(data);
                    setName(data.name || "");
                    setDescription(data.description || "");
                    setSystemPrompt(data.system_prompt || "");
                    setVoice(data.voice || "default");
                    setKnowledgeBase(data.knowledge_base || "");
                } else {
                    router.push("/agents");
                }
            } catch (err) {
                console.error("Fetch agent error:", err);
                alert("Failed to load agent");
                router.push("/agents");
            } finally {
                setLoading(false);
            }
        };

        fetchAgent();
    }, [id, user?.id, router]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from("agents")
                .update({
                    name,
                    description,
                    system_prompt: systemPrompt,
                    voice,
                    knowledge_base: knowledgeBase
                })
                .eq("id", id);

            if (error) throw error;

            alert("Agent details saved successfully.");
            setAgent({ ...agent, name, description, system_prompt: systemPrompt, voice, knowledge_base: knowledgeBase });
        } catch (err) {
            console.error("Save agent error:", err);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert("Please select a file to upload.");

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("agentId", id);
        formData.append("userId", user.id);

        try {
            const res = await fetch("/api/knowledge/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            alert(`File uploaded successfully! Extracted ${data.charsAdded} characters.`);
            setFile(null);
            // Reload the updated knowledge base from DB
            const { data: updatedAgent } = await supabase
                .from("agents")
                .select("knowledge_base")
                .eq("id", id)
                .single();

            if (updatedAgent) {
                setKnowledgeBase(updatedAgent.knowledge_base || "");
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload file: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
                    <p className="text-gray-400">Loading agent details...</p>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black text-white p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Edit Agent: {agent?.name}</h1>
                        <Link
                            href="/agents"
                            className="bg-zinc-800 px-4 py-2 rounded hover:bg-zinc-700 transition"
                        >
                            Back to Agents
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Basic Settings */}
                        <div className="bg-zinc-900 p-6 rounded-lg h-fit">
                            <h2 className="text-xl font-semibold mb-4 border-b border-zinc-800 pb-2">
                                Agent Configuration
                            </h2>
                            <form onSubmit={handleSave} className="space-y-4">
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        System Prompt *
                                    </label>
                                    <textarea
                                        required
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        rows={6}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition mt-4 disabled:opacity-50"
                                >
                                    {saving ? "Saving Changes..." : "Save Configuration"}
                                </button>
                            </form>
                        </div>

                        {/* Right Column: Knowledge Base */}
                        <div className="space-y-8">
                            <div className="bg-zinc-900 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold mb-4 border-b border-zinc-800 pb-2">
                                    Upload Knowledge Document
                                </h2>
                                <form onSubmit={handleUpload} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            File (PDF, TXT, DOCX)
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.txt,.docx"
                                            onChange={(e) => setFile(e.target[0])}
                                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-zinc-800 file:text-blue-400 hover:file:bg-zinc-700 cursor-pointer"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={uploading || !file}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50"
                                    >
                                        {uploading ? "Extracting Text..." : "Upload to Knowledge Base"}
                                    </button>
                                </form>
                                <p className="text-xs text-gray-500 mt-4">
                                    Note: Uploaded documents are extracted to raw text and appended to the knowledge base below.
                                </p>
                            </div>

                            <div className="bg-zinc-900 p-6 rounded-lg flex flex-col h-[500px]">
                                <h2 className="text-xl font-semibold mb-4 border-b border-zinc-800 pb-2">
                                    Raw Knowledge Base Context
                                </h2>
                                <div className="flex-1 flex flex-col min-h-0">
                                    <p className="text-xs text-gray-400 mb-2">
                                        This text acts as context for the agent during calls. You can edit it manually here.
                                    </p>
                                    <textarea
                                        value={knowledgeBase}
                                        onChange={(e) => setKnowledgeBase(e.target.value)}
                                        className="flex-1 w-full bg-zinc-800 border border-zinc-700 rounded p-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
                                        placeholder="Provide information or facts the agent should know..."
                                    />
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded transition border border-zinc-700 disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Save Knowledge Base Edits"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
