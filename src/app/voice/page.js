"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useVoiceAgentContext } from "../context/VoiceAgentContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Link from "next/link";

export default function VoicePage() {
  const { user } = useAuth();
  const { getFullContext, addMessage } = useVoiceAgentContext();
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/agents?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => d.success && setAgents(d.agents || []))
      .catch(console.error);
  }, [user?.id]);

  const startRecording = async () => {
    if (!navigator.mediaDevices) return alert("Audio recording not supported.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = { recorder: mr, stream };
      const chunks = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      mr.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 100) {
          alert("Recording too short. Please speak for at least 1–2 seconds.");
          return;
        }
        await processAudio(blob);
      };
      mr.start(500);
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    const ref = mediaRecorderRef.current;
    if (ref?.recorder?.state !== "inactive") {
      ref?.recorder?.stop();
    }
  };

  const processAudio = async (blob) => {
    setUploading(true);
    setAudioUrl(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob);

      if (selectedAgentId) formData.append("agentId", selectedAgentId.toString());

      if (user?.id) formData.append("userId", user.id);

      const agent = agents.find((a) => a.id === selectedAgentId);
      const agentName = agent?.name || "Default Agent";
      const fullContext = getFullContext(agentName);
      formData.append("context", JSON.stringify(fullContext));

      const res = await fetch("/api/voice", { method: "POST", body: formData });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response from server");
      }
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Processing failed");
      if (!data.reply || !data.audio) throw new Error("No response from AI. Check server logs.");

      setTranscript((prev) => [
        ...prev,
        { sender: "user", text: data.transcript },
        { sender: "AI", text: data.reply },
      ]);
      addMessage(agentName, "user", data.transcript);
      addMessage(agentName, "assistant", data.reply);

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      );
      setAudioUrl(URL.createObjectURL(audioBlob));
    } catch (err) {
      alert(err.message || "Processing failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Voice Call</h1>
            <Link href="/dashboard" className="text-blue-400 hover:underline">
              Dashboard
            </Link>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Agent</label>
            <select
              className="w-full p-2 rounded bg-zinc-800 text-white"
              value={selectedAgentId || ""}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedAgentId(val === "" ? null : val);
              }}
            >
              <option value="">Default</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading}
              className={`px-6 py-3 rounded font-semibold ${recording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                } disabled:opacity-50`}
            >
              {recording ? "Stop Recording" : "Start Recording"}
            </button>
            {uploading && <span className="ml-3 text-yellow-400">Processing…</span>}
          </div>

          {audioUrl && (
            <div className="mb-6">
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Transcript</h2>
            <div className="max-h-80 overflow-y-auto border border-zinc-700 rounded p-4 space-y-2">
              {transcript.map((t, i) => (
                <p
                  key={i}
                  className={t.sender === "AI" ? "text-emerald-400" : "text-gray-300"}
                >
                  <strong>{t.sender}:</strong> {t.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
