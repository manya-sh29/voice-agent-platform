"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);

      if (!error) {
        router.push("/dashboard");
      } else {
        alert(error.message);
      }
    } else {
      const { error } = await signUp(email, password);

      if (!error) {
        router.push("/dashboard");
      } else {
        alert(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">

      {/* LEFT SIDE - INTRO SECTION */}
      <div className="hidden md:flex w-1/2 flex-col justify-center px-16 bg-gradient-to-br from-purple-900/40 to-black backdrop-blur-xl">
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          🎙 AI Voice Agent Platform
        </h1>

        <p className="text-gray-300 text-lg mb-8">
          Build, configure, and interact with intelligent voice agents in real time.
          Experience seamless AI conversations powered by next-generation technology.
        </p>

        <div className="space-y-4 text-gray-400">
          <p>• Real-time Voice Conversations</p>
          <p>• Smart AI Responses</p>
          <p>• Call History & Analytics</p>
          <p>• Modern & Secure Platform</p>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          Powered by AI • Built with Next.js
        </div>
      </div>

      {/* RIGHT SIDE - AUTH SECTION */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">

          <h2 className="text-3xl font-bold text-center mb-6">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          {/* Toggle Buttons */}
          <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
            <button
              className={`flex-1 py-2 rounded-md transition-all ${
                isLogin
                  ? "bg-purple-600 shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 rounded-md transition-all ${
                !isLogin
                  ? "bg-purple-600 shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          {/* Inputs */}
          <input
            type="email"
            placeholder="Email address"
            className="w-full p-3 mb-4 rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 outline-none transition"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-6 rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 outline-none transition"
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Button */}
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 p-3 rounded-lg font-semibold shadow-lg hover:shadow-purple-600/40 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login to Dashboard"
              : "Create Account"}
          </button>

          <p className="text-xs text-center text-gray-500 mt-6">
            Secure authentication powered by Supabase
          </p>

        </div>
      </div>
    </div>
  );
}
