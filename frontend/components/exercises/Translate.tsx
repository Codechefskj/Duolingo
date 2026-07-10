"use client";

import { useState, useEffect } from "react";

export default function Translate({
  options, onChange, locked,
}: {
  options: { word_bank: string[] };
  value: string[];
  onChange: (v: string[]) => void;
  locked: boolean;
}) {
  const [usedSlots, setUsedSlots] = useState<number[]>([]);

  useEffect(() => {
    onChange(usedSlots.map((i) => options.word_bank[i]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedSlots]);

  return (
    <div className="max-w-xl mx-auto w-full">
      <div className="min-h-16 border-b-2 border-line flex flex-wrap gap-2 items-center pb-3 mb-8">
        {usedSlots.length === 0 && <span className="text-mut font-bold">Tap the words below</span>}
        {usedSlots.map((slot) => (
          <button key={slot} onClick={() => !locked && setUsedSlots((s) => s.filter((i) => i !== slot))}
            disabled={locked} className="choice-duo px-4 py-2 text-sm">
            {options.word_bank[slot]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {options.word_bank.map((word, i) => {
          const used = usedSlots.includes(i);
          return (
            <button key={i} onClick={() => !locked && !used && setUsedSlots((s) => [...s, i])}
              disabled={locked || used}
              className={`choice-duo px-4 py-2 text-sm ${used ? "opacity-0 pointer-events-none" : ""}`}>
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
