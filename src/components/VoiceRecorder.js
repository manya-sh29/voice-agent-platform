"use client";

import { useState, useRef } from "react";
import { Room } from "livekit-client";

export default function VoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const roomRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ==================== Connect to LiveKit ====================
  const connectToLiveKit = async () => {
    const room = new Room();
    roomRef.current = room;

    const res = await fetch("/api/livekit-token");
    const { token } = await res.json();

    await room.connect(
      process.env.NEXT_PUBLIC_LIVEKIT_URL,
      token
    );

    console.log(" Connected to LiveKit");

    await room.localParticipant.enableMicrophone();
  };

  const startRecording = async () => {
    try {
      //  Connect LiveKit First
      await connectToLiveKit();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        await uploadAudio(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }

    if (roomRef.current) {
      roomRef.current.disconnect();
      console.log(" Disconnected from LiveKit");
    }
  };

  const uploadAudio = async (blob) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("audio", blob, `voice-${Date.now()}.webm`);

      const res = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Voice API failed");
        alert("Voice processing failed.");
        return;
      }

      const aiAudioBlob = await res.blob();
      const aiAudioUrl = URL.createObjectURL(aiAudioBlob);

      const aiAudio = new Audio(aiAudioUrl);
      aiAudio.play();

    } catch (err) {
      console.error("Upload error:", err);
      alert("Audio upload error. Check console.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-2">Voice Recorder</h3>

      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded ${
          recording
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        } transition`}
        disabled={uploading}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      {uploading && (
        <p className="mt-2 text-sm text-yellow-400">
          Processing voice...
        </p>
      )}

      {audioUrl && (
        <div className="mt-4">
          <p className="text-sm mb-1">Your Recording:</p>
          <audio controls src={audioUrl}></audio>
        </div>
      )}
    </div>
  );
}
