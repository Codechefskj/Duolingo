import Link from "next/link";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import Mascot from "@/components/Mascot";

export default async function PracticePage() {
  const [courses, stats] = await Promise.all([api.getCourses(), api.getMyStats()]);
  const course = courses[0];
  const unlocked = course
    ? course.units.flatMap((u) => u.skills).filter((s) => s.status !== "locked")
    : [];

  return (
    <AppShell stats={stats}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl bg-gradient-to-r from-duo-purple to-[#7c3aed] text-white px-6 py-6 shadow-[0_4px_0_0_#A568D9] flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-white/80">Timed challenge</p>
            <h1 className="text-2xl font-extrabold">Legendary Mode</h1>
            <p className="text-white/90 text-sm mt-1 font-bold">
              Beat a lesson in 90 seconds. No hearts lost — but the clock is merciless. Double XP if you finish!
            </p>
          </div>
          <Mascot size={90} animate="wiggle" />
        </div>

        <h2 className="font-extrabold text-lg mb-4">Choose a skill to challenge</h2>
        <div className="flex flex-col gap-3">
          {unlocked.map((skill) => (
            <Link
              key={skill.id}
              href={`/lesson/${skill.lessons[0].id}?mode=legendary`}
              className="choice-duo px-5 py-4 flex items-center justify-between hover:border-duo-purple"
            >
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-duo-purple/20 border-2 border-duo-purple flex items-center justify-center">👑</span>
                <span>
                  <span className="block">{skill.title}</span>
                  <span className="block text-mut text-xs font-bold">{skill.crowns_earned}/{skill.max_crowns} crowns</span>
                </span>
              </span>
              <span className="text-duo-purple font-extrabold text-sm uppercase">Start ⏱️</span>
            </Link>
          ))}
          {unlocked.length === 0 && <p className="text-mut">Unlock a skill first on the Learn path.</p>}
        </div>
      </div>
    </AppShell>
  );
}
