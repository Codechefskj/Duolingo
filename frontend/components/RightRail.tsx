import Link from "next/link";
import type { UserStats } from "@/lib/types";
import Mascot from "./Mascot";

export default function RightRail({ stats }: { stats: UserStats }) {
  const pct = Math.min(100, Math.round((stats.xp_today / stats.daily_goal_xp) * 100));

  return (
    <>
      {/* Super-style promo (mocked, per assignment) */}
      <div className="card-duo px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-block text-xs font-extrabold text-white px-2 py-0.5 rounded-md bg-gradient-to-r from-duo-purple to-duo-blue mb-2">
              SUPER
            </span>
            <p className="font-extrabold text-lg leading-snug">Try Super for free</p>
            <p className="text-mut text-sm mt-1">
              No ads, unlimited hearts, and legendary challenges!
            </p>
          </div>
          <Mascot size={72} animate="wiggle" />
        </div>
        <button className="w-full mt-4 btn-duo bg-gradient-to-r from-[#3b4eff] to-[#6c3bff] text-white shadow-[0_4px_0_0_#2a37b8]">
          Try 1 week free
        </button>
      </div>

      {/* Leaderboard teaser */}
      <div className="card-duo px-5 py-5">
        <p className="font-extrabold text-lg mb-3">Leaderboards</p>
        <div className="flex items-center gap-4">
          <span className="text-4xl">🛡️</span>
          <p className="text-mut text-sm">
            Earn XP in lessons to climb the ranks against other learners.
          </p>
        </div>
        <Link href="/leaderboard" className="block text-center mt-4 btn-duo-outline w-full py-2.5 text-sm">
          View leaderboard
        </Link>
      </div>

      {/* Daily quests / XP goal */}
      <div className="card-duo px-5 py-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-extrabold text-lg">Daily Quests</p>
          <span className="text-duo-blue text-xs font-extrabold uppercase">View all</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <div className="flex-1">
            <p className="font-bold text-sm mb-1.5">Earn {stats.daily_goal_xp} XP</p>
            <div className="relative h-4 rounded-full bg-line overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-duo-yellow transition-all" style={{ width: `${pct}%` }} />
              <span className="absolute inset-0 text-[10px] font-extrabold flex items-center justify-center">
                {Math.min(stats.xp_today, stats.daily_goal_xp)} / {stats.daily_goal_xp}
              </span>
            </div>
          </div>
          <span className="text-2xl">🧰</span>
        </div>
      </div>
    </>
  );
}