"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Already signed in → go to dashboard.
  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError("Enter a username.");
    if (!password.trim()) return setError("Enter any password.");
    login(username);
    router.replace("/");
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-background p-8 shadow-soft sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/scholar-agent-icon.png"
            alt="Scholar Agent"
            width={64}
            height={64}
            priority
            className="h-16 w-16 rounded-full object-cover shadow-sm"
          />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Sign in to your Scholar Agent workspace.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="your-username"
              autoComplete="username"
              autoFocus
              className="rounded-2xl border border-input bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral focus:bg-card focus:ring-4 focus:ring-coral/15 placeholder:text-muted-foreground"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="rounded-2xl border border-input bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral focus:bg-card focus:ring-4 focus:ring-coral/15 placeholder:text-muted-foreground"
            />
          </label>

          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

          <button
            type="submit"
            className="mt-1 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-coral-foreground shadow-sm transition hover:bg-coral-strong"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-medium text-muted-foreground">
          Demo mode · any username and password works. Same username keeps the same history.
        </p>
      </div>
    </main>
  );
}
