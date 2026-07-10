import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const [entries, stats] = await Promise.all([api.getLeaderboard(), api.getMyStats()]);

  return (
    <AppShell stats={stats} showRail={false}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center gap-3 text-4xl mb-3">
            <span className="opacity-40">🛡️</span><span className="text-5xl">🏆</span><span className="opacity-40">🛡️</span>
          </div>
          <h1 className="text-2xl font-extrabold">Emerald League</h1>
          <p className="text-mut font-bold text-sm mt-1">Top learners by total XP — earn XP to climb!</p>
        </div>

        <div className="card-duo divide-y-2 divide-[var(--line)] overflow-hidden">
          {entries.map((e) => {
            const isMe = e.username === "adi_learns";
            return (
              <div key={e.username} className={`flex items-center gap-4 px-4 py-3.5 ${isMe ? "bg-duo-blue/10" : ""}`}>
                <span className={`w-8 text-center font-extrabold ${e.rank <= 3 ? "text-xl" : "text-mut"}`}>
                  {MEDALS[e.rank - 1] || e.rank}
                </span>
                <span className="w-11 h-11 rounded-full bg-duo-purple/20 border-2 border-duo-purple flex items-center justify-center text-lg">
                  🦉
                </span>
                <span className="flex-1">
                  <span className="block font-extrabold">{e.username}{isMe && <span className="text-duo-blue text-xs ml-2">YOU</span>}</span>
                  <span className="block text-mut text-xs font-bold">🔥 {e.streak_count} day streak</span>
                </span>
                <span className="font-extrabold text-duo-yellow">{e.xp_total} XP</span>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
