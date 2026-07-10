"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Skill } from "@/lib/types";

const OFFSETS = [0, 52, 84, 52, 0, -52, -84, -52];

export default function PathNode({ skill, index }: { skill: Skill; index: number }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const offset = OFFSETS[index % OFFSETS.length];

  const isLocked = skill.status === "locked";
  const isCompleted = skill.status === "completed";
  const isActive = skill.status === "available";

  const nextLesson =
    skill.lessons.find((l) => l.crown_level > skill.crowns_earned) ??
    skill.lessons[skill.lessons.length - 1];

  const ringPct = (skill.crowns_earned / skill.max_crowns) * 100;

  return (
    <div className={`relative flex flex-col items-center ${open ? "z-50" : "z-0"}`} 
      style={{ transform: `translateX(${offset}px)` }}>
      {/* progress ring wrapper (active nodes get a ring like the real path) */}
      <div
        className={`rounded-full p-1.5 ${isActive ? "animate-ring-glow" : ""}`}
        style={
          isActive || (isCompleted && ringPct < 100)
            ? {
                background: `conic-gradient(#58CC02 ${ringPct}%, var(--line) ${ringPct}%)`,
              }
            : undefined
        }
      >
        <div className="rounded-full p-1" style={{ background: "var(--bg)" }}>
          <button
            onClick={() => !isLocked && setOpen((o) => !o)}
            disabled={isLocked}
            aria-label={`${skill.title} — ${skill.status}`}
            className={`relative w-[70px] h-[62px] rounded-[50%] flex items-center justify-center text-2xl
              transition-transform active:translate-y-1 active:shadow-none
              ${isLocked
                ? "bg-[var(--node-locked)] shadow-[0_6px_0_0_var(--node-locked-shadow)] cursor-not-allowed"
                : isCompleted
                ? "bg-duo-yellow shadow-[0_6px_0_0_#E6B000] hover:brightness-105"
                : "bg-duo-green shadow-[0_6px_0_0_#46A302] hover:brightness-105"}`}
          >
            <span className={isLocked ? "opacity-60" : "text-white drop-shadow"}>
              {isCompleted ? "✓" : isLocked ? "🔒" : "★"}
            </span>
          </button>
        </div>
      </div>

      <span className={`mt-1.5 text-xs font-extrabold uppercase tracking-wide ${isLocked ? "text-mut" : ""}`}>
        {skill.title}
      </span>

      {open && !isLocked && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          
          {/* 1. Remove animate-pop-in from this wrapper, keep ONLY the translation */}
          <div className="absolute top-[92px] z-20 w-64" style={{ transform: `translateX(${-offset}px)` }}>
            
            {/* 2. Move animate-pop-in down to this inner card element */}
            <div
              className={`animate-pop-in rounded-2xl px-4 py-4 text-white ${
                isCompleted ? "bg-duo-yellow shadow-[0_4px_0_0_#E6B000]" : "bg-duo-green shadow-[0_4px_0_0_#46A302]"
              }`}
            >
              <p className="font-extrabold mb-1">{skill.title}</p>
              <p className="text-white/85 text-xs font-bold mb-3">
                Crowns: {skill.crowns_earned} / {skill.max_crowns}
              </p>
              <button
                onClick={() => router.push(`/lesson/${nextLesson.id}`)}
                className="w-full btn-duo-white py-2.5 text-sm"
              >
                {isCompleted ? "Practice +10 XP" : skill.crowns_earned === 0 ? "Start +10 XP" : "Continue +10 XP"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}