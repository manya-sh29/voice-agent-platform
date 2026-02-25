"use client";

import Link from "next/link";
import { useAuth } from "./context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white px-6">
      <h1 className="mb-4 text-4xl font-bold text-center">
        AI Voice Agent Platform
      </h1>

      <p className="mb-8 max-w-xl text-center text-gray-400">
        Create, configure, and talk to AI-powered voice agents directly from your browser.
        Real-time voice. Real intelligence.
      </p>

      <div className="flex gap-4">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <Link
              href="/voice"
              className="rounded-lg border border-gray-600 px-6 py-3 font-semibold hover:bg-gray-800 hover:border-gray-500"
            >
              Start Voice Call
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-gray-600 px-6 py-3 font-semibold hover:bg-gray-800"
            >
              Register
            </Link>
          </>
        )}
      </div>

      <p className="mt-10 text-sm text-gray-500">
        Powered by AI • Built with Next.js
      </p>
    </main>
  );
}
