"use client";

const COLORS = ["#58CC02", "#1CB0F6", "#FFC800", "#FF4B4B", "#CE82FF", "#FF9600"];

export default function Confetti({ count = 40 }: { count?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute w-2.5 h-4 rounded-sm"
          style={{
            left: `${(i * 97) % 100}%`,
            top: "-5vh",
            background: COLORS[i % COLORS.length],
            animation: `confetti-fall ${1.8 + (i % 5) * 0.35}s linear ${(i % 7) * 0.15}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
