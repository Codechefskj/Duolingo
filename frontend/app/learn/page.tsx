import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import SkillPath from "@/components/SkillPath";

export default async function LearnPage() {
  const [courses, stats] = await Promise.all([api.getCourses(), api.getMyStats()]);
  const course = courses[0];

  return (
    <AppShell stats={stats}>
      {course ? (
        <div className="py-6">
          <SkillPath course={course} />
        </div>
      ) : (
        <p className="text-center py-24 text-mut font-bold">No course seeded. Run the backend seed script.</p>
      )}
    </AppShell>
  );
}
