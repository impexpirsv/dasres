"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
const router = useRouter();
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
  router.push("/login");
  return;
}
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2">
          Join Dasres
        </h1>

        <p className="text-slate-400 mb-8">
          Create your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
          
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
required
            className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-white"
          />

          <input
          
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-white"
          />

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
            Create Account
          </button>
        </form>

        {message && (
          <p className="text-green-400 mt-6">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}