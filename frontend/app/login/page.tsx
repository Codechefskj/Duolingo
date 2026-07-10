"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import Mascot from "@/components/Mascot";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError("");
    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await api.login(username, password)
          : await api.register(username, password);
      setToken(res.access_token);
      router.push("/learn");
    } catch (err) {
      const msg = String(err);
      if (msg.includes("401")) setError("Invalid username or password.");
      else if (msg.includes("409")) setError("That username is already taken.");
      else if (msg.includes("422")) setError("Username must be 3+ characters, password 6+.");
      else setError("Something went wrong. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-duo p-8 w-full max-w-md flex flex-col items-center gap-4">
        <Mascot size={90} say={mode === "login" ? "Welcome back!" : "Let's get started!"} />
        <h1 className="text-2xl font-extrabold">
          {mode === "login" ? "Log in" : "Create your profile"}
        </h1>

        <input
          className="w-full rounded-2xl border-2 border-line bg-panel px-4 py-3 font-bold outline-none focus:border-duo-blue"
          placeholder="Username"
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full rounded-2xl border-2 border-line bg-panel px-4 py-3 font-bold outline-none focus:border-duo-blue"
          placeholder="Password"
          type="password"
          value={password}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && handleSubmit()}
        />

        {error && <p className="text-duo-red font-bold text-sm text-center">{error}</p>}

        <button
          className="btn-duo-green w-full py-3"
          disabled={busy || !username || !password}
          onClick={handleSubmit}
        >
          {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>

        <button
          className="text-duo-blue font-bold text-sm uppercase tracking-wide"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>

        <button
          className="text-mut font-bold text-xs uppercase tracking-wide"
          onClick={() => router.push("/learn")}
        >
          Continue as demo learner →
        </button>
      </div>
    </div>
  );
}
