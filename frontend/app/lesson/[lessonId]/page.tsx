import { Suspense } from "react";
import LessonPlayer from "@/components/LessonPlayer";

export default function LessonPage({ params }: { params: { lessonId: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LessonPlayer lessonId={Number(params.lessonId)} />
    </Suspense>
  );
}
