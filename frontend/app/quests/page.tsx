import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import Mascot from "@/components/Mascot";

export default async function QuestsPage() {
  const stats = await api.getMyStats();
  return (
    <AppShell stats={stats} showRail={false}>
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <Mascot size={110} say="Quests are coming soon!" />
        <h1 className="text-2xl font-extrabold">Quests</h1>
        <p className="text-mut font-bold">Daily and monthly quests will live here. Coming soon!</p>
      </div>
    </AppShell>
  );
}
