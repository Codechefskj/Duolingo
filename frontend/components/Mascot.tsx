"use client";

/**
 * "Lingo" — our original owl mascot. Deliberately NOT a copy of Duolingo's
 * Duo artwork (that's their copyrighted character); same playful spirit,
 * different design: rounder body, tuft feathers, different face geometry.
 */
export default function Mascot({
  size = 96,
  say,
  animate = "bounce",
  className = "",
}: {
  size?: number;
  say?: string;
  animate?: "bounce" | "wiggle" | "none";
  className?: string;
}) {
  const anim =
    animate === "bounce"
      ? "animate-bounce-soft"
      : animate === "wiggle"
      ? "animate-wiggle"
      : "";

  return (
    <div className={`flex items-end gap-2 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 108 100"
        className={anim}
        aria-label="Lingo the owl mascot"
      >
        <g transform="translate(8,0)">
          {/* tuft */}
          <path d="M38 14 Q42 2 50 10 Q58 2 62 14 Z" fill="#46A302" />

          {/* body */}
          <ellipse cx="50" cy="58" rx="34" ry="36" fill="#58CC02" />

          {/* belly */}
          <ellipse cx="50" cy="68" rx="20" ry="22" fill="#89E219" />

          {/* wings */}
          <ellipse cx="16" cy="60" rx="9" ry="16" fill="#46A302" />
          <ellipse cx="84" cy="60" rx="9" ry="16" fill="#46A302" />

          {/* eyes */}
          <circle cx="38" cy="46" r="12" fill="white" />
          <circle cx="62" cy="46" r="12" fill="white" />

          <circle cx="40" cy="48" r="5" fill="#2b3a41" />
          <circle cx="60" cy="48" r="5" fill="#2b3a41" />

          <circle cx="41.5" cy="46.5" r="1.6" fill="white" />
          <circle cx="61.5" cy="46.5" r="1.6" fill="white" />

          {/* beak */}
          <path
            d="M44 56 Q50 66 56 56 Q50 60 44 56 Z"
            fill="#FF9600"
          />

          {/* feet */}
          <ellipse cx="40" cy="93" rx="6" ry="3.5" fill="#FF9600" />
          <ellipse cx="60" cy="93" rx="6" ry="3.5" fill="#FF9600" />
        </g>
      </svg>

      {say && (
        <div className="card-duo px-4 py-2 mb-6 font-bold text-sm animate-pop-in max-w-56">
          {say}
        </div>
      )}
    </div>
  );
}