import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import Mascot from "@/components/Mascot";

export default async function ShopPage() {
  const stats = await api.getMyStats();
  return (
    <AppShell stats={stats} showRail={false}>
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <Mascot size={110} say="The shop opens soon!" />
        <h1 className="text-2xl font-extrabold">Shop</h1>
        <p className="text-mut font-bold">Streak freezes, outfits, and power-ups — coming soon! Gems are mocked for now.</p>
      </div>
    </AppShell>
  );
}
