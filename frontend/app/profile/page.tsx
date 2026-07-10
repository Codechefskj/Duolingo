import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import Mascot from "@/components/Mascot";

export default async function ProfilePage() {
  const profile = await api.getProfile();
  const s = profile.stats;

  const statCards = [
    { label: "Day streak", value: s.streak_count, icon: "🔥" },
    { label: "Total XP", value: s.xp_total, icon: "⚡" },
    { label: "Crowns", value: profile.total_crowns, icon: "👑" },
    { label: "Skills mastered", value: profile.skills_completed, icon: "🏅" },
  ];

  return (
    <AppShell stats={s} showRail={false}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header card */}
        <div className="card-duo px-6 py-8 mb-8 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-duo-blue/15 border-2 border-duo-blue flex items-center justify-center">
            <Mascot size={70} animate="none" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">{profile.username}</h1>
            <p className="text-mut font-bold text-sm">Joined July 2026 · 🇪🇸 Spanish</p>
            <p className="text-duo-blue font-bold text-sm mt-1">0 Following · 0 Followers</p>
          </div>
          <button className="btn-duo-ghost px-4 py-2 text-sm">✏️</button>
        </div>

        <h2 className="font-extrabold text-lg mb-4">Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {statCards.map((c) => (
            <div key={c.label} className="card-duo px-4 py-4 flex items-center gap-3">
              <span className="text-2xl">{c.icon}</span>
              <span>
                <span className="block text-xl font-extrabold">{c.value}</span>
                <span className="block text-mut text-xs font-bold">{c.label}</span>
              </span>
            </div>
          ))}
        </div>

        <h2 className="font-extrabold text-lg mb-4">Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {profile.achievements.map((a) => (
            <div key={a.id} className={`card-duo px-4 py-4 flex items-center gap-4 ${a.earned ? "" : "opacity-45 grayscale"}`}>
              <span className="w-14 h-14 rounded-xl bg-duo-yellow/15 border-2 border-duo-yellow flex items-center justify-center text-2xl">
                {a.icon}
              </span>
              <span>
                <span className="block font-extrabold">{a.title}</span>
                <span className="block text-mut text-sm">{a.description}</span>
              </span>
              {a.earned && <span className="ml-auto text-duo-green font-extrabold">✓</span>}
            </div>
          ))}
        </div>

        <div className="card-duo px-5 py-4">
          <p className="font-extrabold mb-1">⚙️ Settings</p>
          <p className="text-mut text-sm">Sound, notifications, account — coming soon.</p>
        </div>
      </div>
    </AppShell>
  );
}
