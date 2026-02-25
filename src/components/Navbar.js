"use client";

import Link from "next/link";
import { useAuth } from "../app/context/AuthContext";

export default function Navbar() {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
      <Link href="/" className="text-xl font-bold hover:text-blue-400 transition">
        VoiceAI
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link href="/dashboard" className="hover:text-blue-400 transition">
              Dashboard
            </Link>
            <Link href="/voice" className="hover:text-blue-400 transition">
              Voice Call
            </Link>
            <Link href="/call-history" className="hover:text-blue-400 transition">
              Call History
            </Link>
            <Link href="/profile" className="hover:text-blue-400 transition">
              Profile
            </Link>
            <Link href="/account" className="hover:text-blue-400 transition">
              Account
            </Link>
            <button
              onClick={signOut}
              className="text-red-400 hover:text-red-300 transition"
            >
              Logout
            </button>
          </>
        ) : (
          !loading && (
            <>
              <Link href="/login" className="hover:text-blue-400 transition">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Register
              </Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}
