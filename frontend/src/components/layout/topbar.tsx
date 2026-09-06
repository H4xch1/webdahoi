"use client";

import { logout } from "@/lib/auth";

export function Topbar() {
  return (
    <header className="h-14 bg-topbar flex items-center justify-between px-6">
      <span className="title-display text-sm text-cream tracking-wider">WEBDAHOI</span>
      <button
        onClick={logout}
        className="bg-red text-cream text-xs font-body font-medium rounded-md px-4 py-1.5 hover:brightness-110 transition"
      >
        Log Out
      </button>
    </header>
  );
}
