"use client";

/** Audio via browser text-to-speech — the assignment allows TTS for the
 * audio bonus. Prefers a Spanish voice when available. */
export default function TTSButton({
  text,
  lang = "es-ES",
  size = "lg",
  slow = false,
}: {
  text: string;
  lang?: string;
  size?: "lg" | "sm";
  slow?: boolean;
}) {
  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = slow ? 0.55 : 0.95;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }

  const cls =
    size === "lg"
      ? "w-16 h-16 rounded-2xl text-3xl shadow-[0_4px_0_0_#1899d6]"
      : "w-10 h-10 rounded-xl text-lg shadow-[0_3px_0_0_#1899d6]";

  return (
    <button
      onClick={speak}
      className={`bg-duo-blue text-white flex items-center justify-center
        transition-transform active:translate-y-[3px] active:shadow-none ${cls}`}
      aria-label={slow ? "Play audio slowly" : "Play audio"}
    >
      {slow ? "🐢" : "🔊"}
    </button>
  );
}
