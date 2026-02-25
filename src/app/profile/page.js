"use client";

import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            <Link href="/account" className="text-blue-400 hover:underline">
              Account
            </Link>
          </div>

          <div className="bg-zinc-900 p-6 rounded-lg">
            {user ? (
              <>
                <p className="mb-2"><strong>Email:</strong> {user.email}</p>
                <p className="mb-2"><strong>Name:</strong> {user.user_metadata?.full_name || "—"}</p>
                <p className="text-sm text-gray-500">User ID: {user.id}</p>
              </>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
