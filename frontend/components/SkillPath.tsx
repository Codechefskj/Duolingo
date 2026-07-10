"use client";

import { useState, useEffect, useRef } from "react";
import type { Course } from "@/lib/types";
import PathNode from "./PathNode";
import Mascot from "./Mascot";

export default function SkillPath({ course }: { course: Course }) {
  const [activeUnitIdx, setActiveUnitIdx] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      let currentIdx = 0;
      
      // Check the position of each unit section relative to the top of the screen
      for (let i = 0; i < sectionRefs.current.length; i++) {
        const section = sectionRefs.current[i];
        if (section) {
          const rect = section.getBoundingClientRect();
          // If the section reaches near the top of the screen (underneath our sticky header)
          // it becomes the active unit.
          if (rect.top <= 120) {
            currentIdx = i;
          }
        }
      }
      
      setActiveUnitIdx(currentIdx);
    };

    // Listen for scroll events
    window.addEventListener("scroll", handleScroll);
    
    // Call once to set the initial correct banner on page load
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeUnit = course.units[activeUnitIdx] || course.units[0];
  let flat = 0;

  return (
    <div className="max-w-2xl mx-auto px-4 relative">
      
      {/* 
        1. THE SINGLE STICKY HEADER 
        This sits permanently at the top and morphs based on scroll position 
      */}
      <div className="sticky top-0 z-30 mb-8 transition-colors duration-300">
          {/* THE MASK: A solid 24px block only at the very top to hide the scrolling nodes */}
        <div className="h-6 w-full bg-[var(--bg)] block" /> 
        {/* Note: I used #131f24 based on your previous dark mode colors, but you can swap it back to var(--bg) if needed! */}

        <div
          className={`rounded-2xl px-5 py-4 flex items-center justify-between gap-3 text-white transition-colors duration-300
            ${activeUnitIdx % 2 === 0
              ? "bg-duo-green shadow-[0_4px_0_0_#46A302]"
              : "bg-duo-purple shadow-[0_4px_0_0_#A568D9]"}`}
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-white/80">
              ← Section 1, Unit {activeUnit.order_index + 1}
            </p>
            <p className="font-extrabold text-lg leading-snug">
              {activeUnit.title.replace(/^Unit \d+: /, "")}: {activeUnit.description}
            </p>
          </div>
          <button className="shrink-0 border-2 border-white/40 rounded-xl px-3 py-2 text-xs font-extrabold uppercase flex items-center gap-1.5 shadow-[0_3px_0_0_rgba(0,0,0,0.15)] bg-black/10 hover:bg-black/20 transition-colors">
            📓 Guidebook
          </button>
        </div>
      </div>

      {/* 
        2. THE SCROLLING PATH 
        Notice there are NO unit banners rendered inside this map function anymore.
      */}
      {course.units.map((unit, uIdx) => {
        const activeNodeIdx = unit.skills.findIndex((s) => s.status === "available");
        
        return (
          <section 
            key={unit.id} 
            // Attach the ref so our scroll tracker knows exactly where this section is
            ref={(el) => {
              sectionRefs.current[uIdx] = el;
            }}
            className="relative pb-6"
          >
            {/* Simple text line to visually show where a new unit starts on the path */}
            {uIdx > 0 && (
              <div className="flex items-center gap-4 text-mut font-bold text-sm mb-10 pt-2">
                <div className="flex-1 h-0.5 bg-line rounded" />
                {unit.title}
                <div className="flex-1 h-0.5 bg-line rounded" />
              </div>
            )}

            <div className="relative flex flex-col items-center gap-7 py-4">
              {unit.skills.map((skill, i) => {
                const idx = flat++;
                return (
                  <div key={skill.id} className="relative">
                    <PathNode skill={skill} index={idx} />
                    {i === activeNodeIdx && (
                      <div className="absolute left-24 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none z-0">
                        <Mascot size={88} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}