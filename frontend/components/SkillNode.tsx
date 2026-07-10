"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Skill } from "@/lib/types";
import SkillIcon from "./SkillIcon";

const OFFSETS = [0, 56, 88, 56, 0, -56, -88, -56]; // zigzag path pattern, repeats

export default function SkillNode({ skill, index }: { skill: Skill; index: number }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const offset = OFFSETS[index % OFFSETS.length];

  const nextLesson =
    skill.lessons.find((l) => l.crown_level > skill.crowns_earned) ??
    skill.lessons[skill.lessons.length - 1];

  const isLocked = skill.status === "locked";
  const isCompleted = skill.status === "completed";

  const ringColor = isLocked
    ? "bg-duo-grayLight shadow-[0_4px_0_0_#c9c9c9]"
    : isCompleted
    ? "bg-duo-yellow shadow-[0_4px_0_0_#E6B000]"
    : "bg-duo-green shadow-[0_4px_0_0_#46A302]";

  function handleClick() {
    if (isLocked) return;
    setOpen((o) => !o);
  }

  return (
    <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      <button
        onClick={handleClick}
        disabled={isLocked}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center
          transition-transform active:translate-y-1 active:shadow-none
          ${ringColor} ${isLocked ? "cursor-not-allowed" : "hover:scale-105"}`}
        aria-label={`${skill.title} — ${skill.status}`}
      >
        {isLocked ? (
          <span className="text-2xl">🔒</span>
        ) : (
          <SkillIcon icon={skill.icon} />
        )}
        {isCompleted && (
          <span className="absolute -top-2 -right-1 text-xl" aria-hidden>
            👑
          </span>
        )}
      </button>
      <span className={`mt-2 text-xs font-bold uppercase ${isLocked ? "text-duo-gray" : "text-duo-ink"}`}>
        {skill.title}
      </span>

      {open && !isLocked && (
        <div className="absolute top-24 z-10 animate-pop-in">
          <div className="card-duo shadow-lg px-4 py-3 flex flex-col items-center gap-2 w-40">
            <p className="text-sm font-bold text-center">{skill.title}</p>
            <div className="flex gap-1">
              {Array.from({ length: skill.max_crowns }).map((_, i) => (
                <span key={i} className={i < skill.crowns_earned ? "opacity-100" : "opacity-25"}>
                  👑
                </span>
              ))}
            </div>
            <button
              onClick={() => router.push(`/lesson/${nextLesson.id}`)}
              className="btn-duo-green w-full text-sm py-2"
            >
              {skill.crowns_earned === 0 ? "Start" : isCompleted ? "Practice" : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}