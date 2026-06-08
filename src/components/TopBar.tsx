"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";

function UserMenu({ name, username, onLogout }: { name: string; username: string; onLogout: () => void }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden">
        <Image
          src="/clawd.png"
          alt="Profile"
          width={40}
          height={40}
          className="h-10 w-10 rounded-full border border-border bg-white object-cover shadow-sm transition hover:opacity-90"
        />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
        <div className="border-b border-border px-4 py-3">
          <div className="truncate text-sm font-bold text-foreground">{name}</div>
          <div className="truncate text-xs font-medium text-muted-foreground">@{username}</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full px-4 py-2.5 text-left text-sm font-semibold text-destructive transition hover:bg-accent"
        >
          Sign out
        </button>
      </div>
    </details>
  );
}

export function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/scholar-agent-icon.png"
          alt="Scholar Agent"
          width={48}
          height={48}
          priority
          className="h-12 w-12 rounded-full object-cover shadow-sm"
        />
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-foreground">Scholar Agent</h1>
          <p className="text-xs font-medium text-muted-foreground">Agentic literature review</p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-2.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm sm:inline-flex"
          title="Qwen summarizes · Gemma judges"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qwen.svg" alt="Qwen" className="h-5 w-5" />
          <span className="h-3.5 w-px bg-border" aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gemma-color.svg" alt="Gemma" className="h-5 w-5" />
        </span>
        {user && <UserMenu name={user.name} username={user.username} onLogout={logout} />}
      </div>
    </header>
  );
}
