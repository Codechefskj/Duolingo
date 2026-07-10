"use client";

import { useState, useEffect } from "react";

export default function Match({
  options, onChange, locked,
}: {
  options: { left: string[]; right: string[] };
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  locked: boolean;
}) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});

  useEffect(() => {
    onChange(pairs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs]);

  const matchedRights = new Set(Object.values(pairs));
  const matchedLefts = new Set(Object.keys(pairs));

  return (
    <div className="max-w-lg mx-auto w-full grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-3">
        {options.left.map((word) => (
          <button key={word}
            onClick={() => !locked && !matchedLefts.has(word) && setSelectedLeft(word)}
            disabled={locked || matchedLefts.has(word)}
            className={`choice-duo px-4 py-3 ${matchedLefts.has(word) ? "opacity-30" : ""} ${selectedLeft === word ? "choice-selected" : ""}`}>
            {word}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {options.right.map((word) => (
          <button key={word}
            onClick={() => {
              if (locked || matchedRights.has(word) || !selectedLeft) return;
              setPairs((p) => ({ ...p, [selectedLeft]: word }));
              setSelectedLeft(null);
            }}
            disabled={locked || matchedRights.has(word)}
            className={`choice-duo px-4 py-3 ${matchedRights.has(word) ? "opacity-30" : ""}`}>
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
