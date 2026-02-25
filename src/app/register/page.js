"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function RegisterPage() {
  // Input states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    // Supabase signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }, 
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Account created! Check your email to confirm.");
      // Optionally reset form
      setName("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-6 rounded-xl bg-zinc-900">
        <h1 className="text-2xl font-bold mb-4">Create Account</h1>

        <input
          className="w-full mb-3 p-2 rounded bg-zinc-800 text-white"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full mb-3 p-2 rounded bg-zinc-800 text-white"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full mb-4 p-2 rounded bg-zinc-800 text-white"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-green-600 py-2 rounded"
          onClick={handleRegister}
        >
          Register
        </button>
      </div>
    </div>
  );
}
