const ICON_EMOJI: Record<string, string> = {
  wave: "👋",
  book: "📖",
  chat: "💬",
  food: "🍎",
  family: "👪",
  pencil: "✏️",
  star: "⭐",
};

export default function SkillIcon({ icon, size = 64 }: { icon: string; size?: number }) {
  return (
    <span style={{ fontSize: size * 0.5 }} aria-hidden>
      {ICON_EMOJI[icon] || "⭐"}
    </span>
  );
}
