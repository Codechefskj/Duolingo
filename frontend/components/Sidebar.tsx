"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { isLoggedIn, clearToken } from "@/lib/api";

const ITEMS = [
  { href: "/learn", label: "Learn", icon: "🏠" },
  { href: "/practice", label: "Practice", icon: "💪" },
  { href: "/leaderboard", label: "Leaderboards", icon: "🛡️" },
  { href: "/quests", label: "Quests", icon: "🧭", soon: true },
  { href: "/shop", label: "Shop", icon: "🛍️", soon: true },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // Read auth state in an effect (not during render) so SSR markup and the
  // first client render match — localStorage only exists in the browser.
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => { setLoggedIn(isLoggedIn()); }, [pathname]);

  function handleAuthClick() {
    if (loggedIn) {
      clearToken();
      setLoggedIn(false);
      router.push("/login");
    } else {
      router.push("/login");
    }
  }

  return (
    <>
      {/* Desktop / tablet: left rail */}
      <aside className="hidden sm:flex flex-col sticky top-0 h-screen w-20 lg:w-60 border-r-2 border-line px-2 lg:px-4 py-6 shrink-0">
        <Link href="/learn" className="px-2 lg:px-4 mb-8">
          <span className="text-duo-green font-extrabold text-3xl tracking-tight hidden lg:inline">
            lingo
          </span>
          <span className="text-3xl lg:hidden">🦉</span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl font-bold uppercase text-sm tracking-wide border-2 transition-colors
                  ${active
                    ? "border-duo-blue text-duo-blue bg-duo-blue/10"
                    : "border-transparent text-mut hover:bg-panel"}`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
                {item.soon && (
                  <span className="hidden lg:inline ml-auto text-[10px] bg-panel border border-line rounded px-1.5 py-0.5">
                    SOON
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleAuthClick}
          className="flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl font-bold uppercase text-sm tracking-wide border-2 border-transparent text-mut hover:bg-panel transition-colors"
        >
          <span className="text-2xl">{loggedIn ? "🚪" : "🔑"}</span>
          <span className="hidden lg:inline">{loggedIn ? "Log out" : "Log in"}</span>
        </button>

        <ThemeToggle />
      </aside>

      {/* Mobile: bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t-2 border-line bg-bg flex justify-around py-2">
        {ITEMS.filter((i) => !i.soon).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-2xl p-2 rounded-xl border-2 ${
                active ? "border-duo-blue bg-duo-blue/10" : "border-transparent"
              }`}
              aria-label={item.label}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
