"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserStats } from "@/lib/types";
import { api } from "@/lib/api";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
// July 2026 has 31 days
const JULY_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function TopStats({ stats }: { stats: UserStats }) {
  // Unified state to track which specific menu is being hovered
  const [activeDropdown, setActiveDropdown] = useState<"streak" | "gems" | "hearts" | null>(null);
  const [streakTab, setStreakTab] = useState<"personal" | "friends">("personal");
  
  const [hearts, setHearts] = useState(stats.hearts);
  const [gems, setGems] = useState(stats.gems);
  const router = useRouter();

  async function refill() {
    try {
      const res = await api.refillHearts();
      setHearts(res.hearts);
      setGems(res.gems);
      router.refresh();
    } catch {
      /* not enough gems */
    }
  }

  function Stat({
    emoji, value, color, onClick, isActive
  }: { 
    emoji: string; value: number; color: string; onClick?: () => void; isActive?: boolean;
  }) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 font-extrabold text-lg px-2 py-1 rounded-xl transition-colors ${color}
          ${isActive ? "bg-black/10 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
      >
        <span className="text-2xl leading-none">{emoji}</span>
        <span>{value}</span>
      </button>
    );
  }

  return (
    <div className="relative z-[100] flex items-center gap-2 sm:gap-4">
      
      <span className="flex items-center gap-1.5 font-extrabold text-lg text-duo-yellow px-2">
        <span className="text-2xl">⚡</span>{stats.xp_total}
      </span>

      {/* STREAK WIDGET */}
      <div 
        className="relative flex items-center"
        onMouseEnter={() => setActiveDropdown("streak")}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <Stat 
          emoji="🔥" 
          value={stats.streak_count} 
          color="text-duo-orange" 
          isActive={activeDropdown === "streak"} 
        />
        
        {activeDropdown === "streak" && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 z-[100] w-[330px] cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="animate-pop-in bg-[#131f24] rounded-2xl overflow-hidden border-2 border-[#37464f] shadow-2xl p-5 text-white relative">
              
              <div className="flex border-b-2 border-[#37464f] mb-6">
                <button
                  onClick={() => setStreakTab("personal")}
                  className={`flex-1 pb-3 font-extrabold text-[13px] tracking-widest uppercase transition-colors
                    ${streakTab === "personal" ? "text-[#1cb0f6] border-b-2 border-[#1cb0f6] -mb-[2px]" : "text-[#52656d] hover:text-gray-400"}`}
                >
                  Personal
                </button>
                <button
                  onClick={() => setStreakTab("friends")}
                  className={`flex-1 pb-3 font-extrabold text-[13px] tracking-widest uppercase transition-colors
                    ${streakTab === "friends" ? "text-[#1cb0f6] border-b-2 border-[#1cb0f6] -mb-[2px]" : "text-[#52656d] hover:text-gray-400"}`}
                >
                  Friends
                </button>
              </div>

              {streakTab === "personal" ? (
                <div className="animate-fade-in">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-extrabold text-[#52656d]">{stats.streak_count} day streak</h2>
                    <span className="text-6xl opacity-20 grayscale">🔥</span>
                  </div>

                  <div className="bg-[#202f36] rounded-2xl p-4 flex items-center gap-4 mb-8">
                    <div className="bg-[#ff9600] w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-2xl drop-shadow-md">⏱️</span>
                    </div>
                    <div>
                      <p className="text-[#afc0c5] font-bold leading-tight mb-1 text-sm">
                        Do a lesson today to start a new streak!
                      </p>
                      <button className="text-[#1cb0f6] font-extrabold text-[13px] uppercase tracking-wide hover:brightness-125 transition-all">
                        Start a streak
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-4">Calendar</h3>
                  <div>
                    <div className="flex justify-between items-center mb-4 px-2 text-[#afc0c5] font-extrabold text-[13px] tracking-wide">
                      <button className="hover:text-white transition-colors">&lt;</button>
                      <span>JULY 2026</span>
                      <button className="hover:text-white transition-colors">&gt;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-y-4 mb-2 text-center">
                      {WEEKDAYS.map((d, i) => (
                        <div key={i} className="text-[#52656d] text-xs font-extrabold">{d}</div>
                      ))}
                      
                      <div />
                      <div />
                      
                      {JULY_DAYS.map(day => (
                        <div key={day} className="flex justify-center">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm transition-colors
                            ${day === 10 ? "bg-[#37464f] text-white ring-2 ring-[#37464f]" : "text-[#afc0c5] hover:bg-[#202f36] cursor-pointer"}`}
                          >
                            {day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in flex flex-col items-center text-center py-4">
                  <div className="relative mb-6">
                    <span className="text-[80px]">🔥</span>
                    <span className="absolute -bottom-2 -right-4 text-5xl">🦉</span>
                  </div>
                  <p className="text-[17px] font-extrabold text-white mb-8 px-2 leading-snug">
                    Start <span className="text-[#1cb0f6]">Friend Streaks</span> to make daily progress together!
                  </p>
                  <button className="w-full bg-[#1cb0f6] hover:bg-[#1899d6] text-[#131f24] py-3.5 rounded-2xl font-extrabold uppercase tracking-widest transition-colors shadow-[0_4px_0_0_#1899d6] active:translate-y-1 active:shadow-none">
                    + Add friends
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* GEMS WIDGET */}
      <div 
        className="relative flex items-center"
        onMouseEnter={() => setActiveDropdown("gems")}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <Stat 
          emoji="💎" 
          value={gems} 
          color="text-duo-blue" 
          isActive={activeDropdown === "gems"}
        />
        
        {activeDropdown === "gems" && (
          <div className="absolute right-0 top-full pt-4 z-[100] w-[340px] cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="animate-pop-in relative">
              <div className="absolute -top-[9px] right-8 w-4 h-4 bg-[#131f24] border-t-2 border-l-2 border-[#37464f] rotate-45 rounded-tl-sm z-0"></div>
              
              <div className="bg-[#131f24] rounded-2xl border-2 border-[#37464f] shadow-2xl p-5 flex items-center gap-5 text-white relative z-10">
                <div className="w-20 h-20 bg-[#ffc800] rounded-xl flex items-center justify-center shrink-0 border-b-4 border-[#e5a500]">
                  <span className="text-5xl drop-shadow-md">💎</span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold mb-1">Gems</h2>
                  <p className="text-[#afc0c5] font-bold text-sm mb-3">You have {gems} gems</p>
                  <button className="text-[#1cb0f6] font-extrabold text-[13px] uppercase tracking-wide hover:brightness-125 transition-all">
                    Go to shop
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HEARTS WIDGET */}
      <div 
        className="relative flex items-center"
        onMouseEnter={() => setActiveDropdown("hearts")}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <Stat 
          emoji="❤️" 
          value={hearts} 
          color="text-duo-red" 
          isActive={activeDropdown === "hearts"}
        />
        
        {activeDropdown === "hearts" && (
          <div className="absolute right-0 top-full pt-4 z-[100] w-[340px] cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="animate-pop-in relative">
              <div className="absolute -top-[9px] right-8 w-4 h-4 bg-[#131f24] border-t-2 border-l-2 border-[#37464f] rotate-45 rounded-tl-sm z-0"></div>
              
              <div className="bg-[#131f24] rounded-2xl border-2 border-[#37464f] shadow-2xl p-6 text-white relative z-10">
                <h2 className="text-xl font-extrabold text-center mb-4">Hearts</h2>
                
                <div className="flex justify-center gap-2 text-3xl mb-4">
                  {Array.from({ length: stats.hearts_max }).map((_, i) => (
                    <span key={i} className={i < hearts ? "" : "opacity-25 grayscale"}>❤️</span>
                  ))}
                </div>
                
                <p className="text-center font-extrabold mb-1">
                  {hearts >= stats.hearts_max ? "You have full hearts" : `${hearts} of ${stats.hearts_max} hearts`}
                </p>
                <p className="text-center text-[#afc0c5] font-bold text-sm mb-6">
                  {hearts >= stats.hearts_max
                    ? "Keep on learning"
                    : stats.seconds_to_next_heart
                    ? `Next heart in ${Math.ceil(stats.seconds_to_next_heart / 60)} min`
                    : "Hearts regenerate over time"}
                </p>
                
                <div className="flex flex-col gap-3">
                  <button className="flex items-center justify-between border-2 border-[#37464f] rounded-2xl px-5 py-4 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3 font-extrabold text-[13px] uppercase tracking-wide">
                      <span className="text-2xl group-hover:scale-110 transition-transform">♾️</span> UNLIMITED HEARTS
                    </div>
                    <span className="text-[#ce82ff] font-extrabold text-[13px] uppercase tracking-wide">Free trial</span>
                  </button>
                  
                  <button
                    onClick={refill}
                    disabled={hearts >= stats.hearts_max || gems < 350}
                    className={`flex items-center justify-between border-2 border-[#37464f] rounded-2xl px-5 py-4 transition-colors group
                      ${hearts >= stats.hearts_max || gems < 350 ? "opacity-50 cursor-not-allowed" : "hover:bg-white/5"}`}
                  >
                    <div className="flex items-center gap-3 font-extrabold text-[13px] uppercase tracking-wide text-white">
                      <span className="text-2xl opacity-60 group-hover:scale-110 transition-transform grayscale">🤍</span> REFILL HEARTS
                    </div>
                    <span className="text-[#afc0c5] font-extrabold flex items-center gap-1">
                      <span className="text-sm">💎</span> 350
                    </span>
                  </button>

                  <button className="flex items-center justify-start gap-3 border-2 border-[#37464f] rounded-2xl px-5 py-4 hover:bg-white/5 transition-colors group font-extrabold text-[13px] uppercase tracking-wide">
                      <span className="text-2xl opacity-60 group-hover:scale-110 transition-transform grayscale">🤍</span> PRACTICE TO EARN HEARTS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}