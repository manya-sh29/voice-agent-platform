"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Link from "next/link";

export default function CallHistoryPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [transcriptView, setTranscriptView] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    fetch(`/api/call-history?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCalls(data.calls || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  const openScorecard = (call) => {
    setSelectedCall(call);
    setTranscriptView(null);
    setScorecard(null);
    fetch(`/api/call-scorecard/${call.id}?userId=${user?.id}`)
      .then((res) => res.json())
      .then((data) => data.success && setScorecard(data.scorecard))
      .catch(console.error);
  };

  const openTranscript = (call) => {
    setTranscriptView(call);
    setSelectedCall(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Call History</h1>
            <Link
              href="/dashboard"
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Dashboard
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-400">Loading…</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="bg-zinc-900 p-6 rounded-lg text-center">
              <p className="text-gray-400">No calls yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-zinc-900 rounded-lg">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-zinc-800 text-gray-200 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Agent Used</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr
                      key={call.id}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <td className="px-6 py-4">
                        {call.call_start
                          ? new Date(call.call_start).toLocaleString()

                          : "N/A"}
                      </td>
                      <td className="px-6 py-4">{call.call_duration || "N/A"}</td>
                      <td className="px-6 py-4">{call.agent_name || "Default"}</td>
                      <td className="px-6 py-4">{call.call_status || "N/A"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openTranscript(call)}
                            className="text-emerald-400 hover:underline text-xs"
                          >
                            View Transcript
                          </button>
                          <button
                            onClick={() => openScorecard(call)}
                            className="text-blue-400 hover:underline text-xs"
                          >
                            Scorecard
                          </button>
                          <a
                            href={`/api/export-transcript/${call.id}`}
                            download={`transcript-${call.id}.txt`}
                            className="text-green-400 hover:underline text-xs"
                          >
                            Export TXT
                          </a>
                          <a
                            href={`/api/export-transcript/${call.id}?format=pdf`}
                            download={`transcript-${call.id}.pdf`}
                            className="text-amber-400 hover:underline text-xs"
                          >
                            Export PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {transcriptView && (
            <div className="mt-8 bg-zinc-900 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Full Conversation Transcript</h2>
                <div className="flex gap-2">
                  <a
                    href={`/api/export-transcript/${transcriptView.id}`}
                    download={`transcript-${transcriptView.id}.txt`}
                    className="text-green-400 hover:underline text-sm"
                  >
                    Export TXT
                  </a>
                  <a
                    href={`/api/export-transcript/${transcriptView.id}?format=pdf`}
                    download={`transcript-${transcriptView.id}.pdf`}
                    className="text-amber-400 hover:underline text-sm"
                  >
                    Export PDF
                  </a>
                  <button
                    onClick={() => setTranscriptView(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
              <p className="text-gray-500 text-xs mb-3">
                {transcriptView.call_start
                  ? new Date(transcriptView.call_start).toLocaleString()
                  : ""}
                {transcriptView.call_duration && ` • ${transcriptView.call_duration}`}
                {transcriptView.agent_name && ` • ${transcriptView.agent_name}`}
              </p>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-500 font-medium mb-1">User:</p>
                  <p className="text-gray-300 bg-zinc-800 p-3 rounded">{transcriptView.user_message || "(no message)"}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1">AI:</p>
                  <p className="text-gray-300 bg-zinc-800 p-3 rounded">{transcriptView.ai_response || "(no response)"}</p>
                </div>
              </div>
            </div>
          )}

          {selectedCall && (
            <div className="mt-8 bg-zinc-900 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Call Scorecard</h2>
                <button
                  onClick={() => setSelectedCall(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              {scorecard ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Quality</p>
                    <p className="text-lg font-semibold">{scorecard.qualityRating}/10</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Accuracy</p>
                    <p className="text-lg font-semibold">{scorecard.responseAccuracy}/10</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Goal</p>
                    <p className="text-lg font-semibold capitalize">{scorecard.goalCompletion}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sentiment</p>
                    <p className="text-lg font-semibold capitalize">{scorecard.sentiment}</p>
                  </div>
                  {scorecard.keyTopics?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Key topics</p>
                      <p className="text-gray-300">{scorecard.keyTopics.join(", ")}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">Loading scorecard…</p>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
