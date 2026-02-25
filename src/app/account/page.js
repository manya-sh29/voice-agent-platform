"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import Link from "next/link";

export default function AccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      alert('Type "DELETE" to confirm.');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await supabase.auth.signOut();
      router.replace("/");
    } catch (err) {
      alert(err.message || "Could not delete account.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Account Settings</h1>
            <Link href="/profile" className="text-blue-400 hover:underline">
              Profile
            </Link>
          </div>

          <div className="bg-zinc-900 p-6 rounded-lg border border-red-900/50">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Delete Account</h2>
            <p className="text-sm text-gray-400 mb-4">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Type <strong className="text-white">DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full p-2 rounded bg-zinc-800 text-white mb-4"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || confirmText !== "DELETE"}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting…" : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
