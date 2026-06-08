"use client";

import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { ScrollToTop } from "./ScrollToTop";

/** The floating rounded panel on the warm canvas, shared by every signed-in page. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-full w-full bg-canvas px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 rounded-[2rem] bg-background p-4 shadow-soft sm:p-8 lg:p-10">
        <TopBar />
        {children}
      </div>
      <ScrollToTop />
    </main>
  );
}

/** Lightweight loading shell shown while auth state resolves. */
export function LoadingShell() {
  return (
    <main className="flex min-h-full w-full items-center justify-center bg-canvas">
      <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-coral" />
        Loading…
      </div>
    </main>
  );
}
