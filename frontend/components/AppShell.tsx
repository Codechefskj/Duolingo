import Sidebar from "./Sidebar";
import TopStats from "./TopStats";
import RightRail from "./RightRail";
import type { UserStats } from "@/lib/types";

export default function AppShell({
  stats,
  children,
  showRail = true,
}: {
  stats: UserStats;
  children: React.ReactNode;
  showRail?: boolean;
}) {
  return (
    // 1. Removed max-w-7xl so it spans the entire screen width again
    <div className="flex min-h-screen">
      
      {/* COLUMN 1: Sidebar (Assuming this is already fixed/sticky inside its own component) */}
      <Sidebar />

      {/* COLUMN 2: The Main Learning Path */}
      <main className="flex-1 min-w-0 pt-0 pb-24 sm:pb-8">
        {/* Mobile-only stats */}
        <div className="xl:hidden flex justify-end px-4 mb-4">
          <TopStats stats={stats} />
        </div>
        
        {children}
      </main>

      {/* COLUMN 3: The Right Sidebar */}
      {showRail && (
        // REMOVED: overflow-y-auto
        <aside className="hidden xl:flex flex-col w-[360px] shrink-0 px-6 pt-6 pb-6 space-y-6 h-screen sticky top-0">
          
          <div className="flex justify-end">
            <TopStats stats={stats} />
          </div>
          
          <RightRail stats={stats} />
          
        </aside>
      )}
    </div>
  );
}