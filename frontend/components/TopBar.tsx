"use client";

import Link from "next/link";
import type { UserStats } from "@/lib/types";

function Stat({ emoji, value, color }: { emoji: string; value: number | string; color: string }) {
  return (
    <div className={`flex items-center gap-1 font-extrabold text-lg ${color}`}>
      <span className="text-xl leading-none">{emoji}</span>
      <span>{value}</span>
    </div>
  );
}

export default function TopBar({ stats }: { stats: UserStats | null }) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b-2 border-duo-grayLight">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/learn" className="font-extrabold text-2xl text-duo-green tracking-tight">
          duo<span className="text-duo-blue">clone</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-duo-gray font-bold">
          <Link href="/learn" className="hover:text-duo-green transition-colors">Learn</Link>
          <Link href="/leaderboard" className="hover:text-duo-yellowDark transition-colors">Leaderboard</Link>
          <Link href="/profile" className="hover:text-duo-blue transition-colors">Profile</Link>
        </nav>

        {stats && (
          <div className="flex items-center gap-4">
            <Stat emoji="🔥" value={stats.streak_count} color="text-duo-red" />
            <Stat emoji="💎" value={stats.gems} color="text-duo-blue" />
            <Stat emoji="❤️" value={stats.hearts} color="text-duo-red" />
          </div>
        )}
      </div>
    </header>
  );
}