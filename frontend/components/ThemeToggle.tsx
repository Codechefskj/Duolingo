"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-mut hover:bg-panel w-full"
      aria-label="Toggle dark mode"
    >
      <span className="text-xl">{theme === "dark" ? "☀️" : "🌙"}</span>
      <span className="hidden lg:inline uppercase text-sm tracking-wide">
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
