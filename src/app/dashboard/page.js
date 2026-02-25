"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import { useVoiceAgentContext } from "../context/VoiceAgentContext";

export default function DashboardPage() {
  const [agents, setAgents] = useState([]);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [aiReply, setAiReply] = useState("");
  const [transcript, setTranscript] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const [callsToday, setCallsToday] = useState(0);
  const [apiUsage, setApiUsage] = useState(0);

  const mediaRecorderRef = useRef(null);
  const { addMessage, getFullContext } = useVoiceAgentContext();

  const templates = [
    {
      name: "Customer Support Agent",
      description: "Handles customer queries and provides troubleshooting help.",
      systemPrompt:
        "You are a helpful customer support agent. Respond politely and solve user issues clearly.",
    },
    {
      name: "Sales Assistant",
      description: "Explains products and helps convert leads into customers.",
      systemPrompt:
        "You are a professional sales assistant. Speak confidently and highlight product benefits.",
    },
    {
      name: "FAQ / Information Agent",
      description: "Answers frequently asked questions clearly and accurately.",
      systemPrompt:
        "You are an FAQ assistant. Provide short and accurate informational answers.",
    },
    {
      name: "Appointment Scheduler",
      description: "Schedules meetings and confirms available time slots.",
      systemPrompt:
        "You are an appointment scheduling assistant. Help users book meetings efficiently.",
    },
    {
      name: "Lead Qualification Agent",
      description: "Qualifies potential customers and gathers key details.",
      systemPrompt:
        "You are a lead qualification agent. Ask relevant questions and assess user intent.",
    },
    {
      name: "Technical Support Agent",
      description: "Provides technical troubleshooting assistance.",
      systemPrompt:
        "You are a technical support assistant. Diagnose issues step-by-step and guide clearly.",
    },
  ];

  const handleCreateFromTemplate = async (template) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return alert("Please login first");

    const { data, error } = await supabase
      .from("agents")
      .insert([
        {
          name: template.name,
          description: template.description,
          system_prompt: template.systemPrompt,
          voice: "Default",
          user_id: user.id,
        },
      ])
      .select();

    if (error) alert(error.message);
    else {
      alert(`Agent "${template.name}" created successfully!`);
      setAgents((prev) => [...prev, data[0]]);
      setSelectedAgentId(data[0].id); // automatically select new agent
    }
  };

  // ===================== Voice Recording =====================
  const startRecording = async () => {
    if (!navigator.mediaDevices)
      return alert("Your browser does not support audio recording.");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setRecording(false);
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Error accessing microphone. Allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // ===================== PROCESS AUDIO =====================
  const processAudio = async (blob) => {
    setUploading(true);
    setAudioUrl(null);
    setAiReply("");
    setTranscript("");

    try {
      const formData = new FormData();
      formData.append("audio", blob);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) formData.append("userId", user.id);

      if (selectedAgentId) formData.append("agentId", selectedAgentId);

      const agentName =
        agents.find((a) => a.id === selectedAgentId)?.name || "Default Agent";

      const fullContext = getFullContext(agentName);
      formData.append("context", JSON.stringify(fullContext));

      const res = await fetch("/api/voice", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Processing failed");

      setTranscript(data.transcript);
      setAiReply(data.reply);

      addMessage(agentName, "user", data.transcript);
      addMessage(agentName, "assistant", data.reply);

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      );
      setAudioUrl(URL.createObjectURL(audioBlob));
    } catch (err) {
      console.error("Processing error:", err);
      alert("Failed to process audio. Check console.");
    } finally {
      setUploading(false);
    }
  };

  // ===================== FETCH DASHBOARD STATS =====================
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // ---------- Calls Today ----------
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { count: callsCount, error: callsError } = await supabase
          .from("voice_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("call_start", todayStart.toISOString())
          .lte("call_start", todayEnd.toISOString());

        if (callsError) console.error("Calls Today fetch error:", callsError);
        setCallsToday(callsCount || 0);

        // ---------- API Usage ----------
        const { count: usageCount, error: usageError } = await supabase
          .from("api_usage")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (usageError) console.error("API Usage fetch error:", usageError);
        setApiUsage(usageCount || 0);

      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      }
    };

    fetchDashboardStats();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) fetchDashboardStats();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ===================== UI =====================
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          href="/call-history"
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Call History
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-zinc-900 p-4 rounded">
          <h2 className="text-lg font-semibold">Active Agents</h2>
          <p className="text-2xl font-bold mt-2">{agents.length}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded">
          <h2 className="text-lg font-semibold">Calls Today</h2>
          <p className="text-2xl font-bold mt-2">{callsToday}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded">
          <h2 className="text-lg font-semibold">API Usage</h2>
          <p className="text-2xl font-bold mt-2">{apiUsage}</p>
        </div>
      </div>

      <div className="bg-zinc-900 p-4 rounded mb-10">
        <h2 className="text-xl font-semibold mb-2">Voice Call / Recording</h2>

        <select
          className="mb-2 p-2 rounded bg-zinc-800 text-white"
          value={selectedAgentId || ""}
          onChange={(e) => setSelectedAgentId(e.target.value || null)}
        >
          <option value="">Default Agent</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        <br />

        <button
          onClick={recording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded ${
            recording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          }`}
          disabled={uploading}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>

        {uploading && <p className="mt-2 text-sm text-yellow-400">Processing audio...</p>}
        {transcript && <p className="mt-2 text-sm text-gray-300">You said: {transcript}</p>}
        {aiReply && <p className="mt-2 text-sm text-gray-300">AI reply: {aiReply}</p>}
        {audioUrl && (
          <div className="mt-4">
            <audio controls src={audioUrl}></audio>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Agent Templates Library</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template, index) => (
          <div key={index} className="bg-zinc-900 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2">{template.name}</h3>
            <p className="text-sm text-gray-400 mb-4">{template.description}</p>
            <button
              onClick={() => handleCreateFromTemplate(template)}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Select Agent
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
