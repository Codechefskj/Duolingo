"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { LessonStart, AnswerResult, LessonComplete } from "@/lib/types";
import ExerciseRenderer from "./ExerciseRenderer";
import FeedbackBar from "./FeedbackBar";
import Modal from "./Modal";
import Mascot from "./Mascot";
import Confetti from "./Confetti";
import TTSButton from "./TTSButton";

type Phase = "loading" | "active" | "checked" | "complete" | "out_of_hearts" | "timeout" | "error";

const CHEERS = ["You've got this!", "¡Excelente!", "Keep it up!", "On a roll!"];
const LEGENDARY_SECONDS = 90;

function isAnswerEmpty(v: unknown): boolean {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

export default function LessonPlayer({ lessonId }: { lessonId: number }) {
  const router = useRouter();
  const legendary = useSearchParams().get("mode") === "legendary";

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<LessonStart | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<unknown>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [summary, setSummary] = useState<LessonComplete | null>(null);
  const [hearts, setHearts] = useState(5);
  const [timeLeft, setTimeLeft] = useState(LEGENDARY_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.startLesson(lessonId)
      .then((res) => { setData(res); setHearts(res.hearts); setPhase("active"); })
      .catch((err) =>
        String(err).includes("400") ? setPhase("out_of_hearts") : (setErrorMsg(String(err)), setPhase("error"))
      );
  }, [lessonId]);

  // Legendary countdown
  useEffect(() => {
    if (!legendary || phase === "loading") return;
    if (phase === "complete" || phase === "timeout" || phase === "out_of_hearts") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase("timeout"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legendary, phase === "loading"]);

  if (phase === "loading")
    return <div className="min-h-screen flex items-center justify-center text-mut font-bold">Loading lesson…</div>;
  if (phase === "error")
    return <div className="min-h-screen flex items-center justify-center text-duo-red font-bold px-6 text-center">Couldn&apos;t load lesson: {errorMsg}</div>;

  if (phase === "out_of_hearts")
    return (
      <Modal>
        <div className="card-duo p-6 text-center flex flex-col items-center gap-4">
          <span className="text-6xl">💔</span>
          <h2 className="text-2xl font-extrabold">You ran out of hearts!</h2>
          <p className="text-mut">Wait for them to regenerate, or refill with gems.</p>
          <button
            className="btn-duo-blue w-full py-3"
            onClick={async () => {
              try {
                await api.refillHearts();
                setPhase("loading");
                const res = await api.startLesson(lessonId);
                setData(res); setHearts(res.hearts); setIndex(0); setAnswer(null); setResult(null);
                setPhase("active");
              } catch { /* not enough gems */ }
            }}
          >
            Refill with 💎 350
          </button>
          <button className="btn-duo-ghost w-full py-3" onClick={() => router.push("/learn")}>
            Back to path
          </button>
        </div>
      </Modal>
    );

  if (phase === "timeout")
    return (
      <Modal>
        <div className="card-duo p-6 text-center flex flex-col items-center gap-4">
          <span className="text-6xl">⏰</span>
          <h2 className="text-2xl font-extrabold text-duo-purple">Time&apos;s up!</h2>
          <p className="text-mut">Legendary challenges must be finished in {LEGENDARY_SECONDS} seconds.</p>
          <button className="btn-duo-purple w-full py-3" onClick={() => window.location.reload()}>Try again</button>
          <button className="btn-duo-ghost w-full py-3" onClick={() => router.push("/learn")}>Back to path</button>
        </div>
      </Modal>
    );

  if (!data) return null;
  const exercise = data.exercises[index];
  const progressPct = Math.round((index / data.exercises.length) * 100);
  const midway = index === Math.floor(data.exercises.length / 2) && phase === "active";

  async function handleCheck() {
    if (!data) return;
    const res = await api.submitAnswer(data.lesson_attempt_id, exercise.id, answer);
    setResult(res); setHearts(res.hearts_remaining); setPhase("checked");
  }

  async function handleSkip() {
    if (!data) return;
    const res = await api.submitAnswer(data.lesson_attempt_id, exercise.id, "__skipped__");
    setResult(res); setHearts(res.hearts_remaining); setPhase("checked");
  }

  async function handleContinue() {
    if (!data || !result) return;
    if (result.out_of_hearts && !legendary) { setPhase("out_of_hearts"); return; }
    if (index + 1 >= data.exercises.length) {
      const done = await api.completeLesson(data.lesson_attempt_id, legendary ? "legendary" : undefined);
      setSummary(done); setPhase("complete"); return;
    }
    setIndex((i) => i + 1); setAnswer(null); setResult(null); setPhase("active");
  }

  if (phase === "complete" && summary)
    return (
      <>
        <Confetti />
        <Modal>
          <div className="card-duo p-6 text-center flex flex-col items-center gap-3">
            <Mascot size={110} say={legendary ? "Legendary!" : "Lesson complete!"} />
            <div className="grid grid-cols-2 gap-3 w-full my-2">
              <div className="rounded-2xl border-2 border-duo-yellow overflow-hidden">
                <p className="bg-duo-yellow text-[#131f24] text-xs font-extrabold py-1 uppercase">Total XP</p>
                <p className="text-2xl font-extrabold text-duo-yellow py-2">⚡ {summary.xp_earned}</p>
              </div>
              <div className="rounded-2xl border-2 border-duo-green overflow-hidden">
                <p className="bg-duo-green text-[#131f24] text-xs font-extrabold py-1 uppercase">Accuracy</p>
                <p className="text-2xl font-extrabold text-duo-green py-2">{Math.round(summary.accuracy * 100)}%</p>
              </div>
            </div>
            {summary.daily_goal_met && <p className="text-duo-green font-bold text-sm">🎯 Daily goal reached!</p>}
            <p className="text-mut text-sm">🔥 {summary.new_streak} day streak</p>
            <button className="btn-duo-green w-full py-3 mt-2" onClick={() => router.push("/learn")}>
              Continue
            </button>
          </div>
        </Modal>
      </>
    );

  return (
    <div className="min-h-screen flex flex-col pb-36">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-6 flex items-center gap-4">
        <button onClick={() => router.push("/learn")} className="text-mut text-2xl font-bold hover:text-ink" aria-label="Exit lesson">✕</button>
        <div className="flex-1 h-4 rounded-full bg-line overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${legendary ? "bg-duo-purple" : "bg-duo-green"}`}
            style={{ width: `${Math.max(progressPct, 4)}%` }}
          />
        </div>
        {legendary ? (
          <div className="flex items-center gap-1 font-extrabold text-duo-purple"><span>⏱️</span><span>{timeLeft}s</span></div>
        ) : (
          <div className="flex items-center gap-1 font-extrabold text-duo-red"><span>❤️</span><span>{hearts}</span></div>
        )}
      </div>

      {/* Exercise */}
      <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full px-4 py-8">
        <p className="text-mut font-extrabold text-sm uppercase tracking-wide mb-2">
          {labelFor(exercise.type)}
        </p>
        <div className="flex items-center gap-4 mb-8">
          <TTSButton text={ttsTextFor(exercise.type, exercise.prompt)}/>
          <TTSButton text={ttsTextFor(exercise.type, exercise.prompt)} slow size="sm" />
          <h2 className="text-xl sm:text-2xl font-extrabold">{exercise.prompt}</h2>
        </div>
        <div className={phase === "checked" && result && !result.is_correct ? "animate-shake" : ""}>
          <ExerciseRenderer exercise={exercise} value={answer} onChange={setAnswer} locked={phase === "checked"} />
        </div>
        {midway && index > 0 && (
          <div className="mt-8 flex justify-center"><Mascot size={72} say={CHEERS[index % CHEERS.length]} /></div>
        )}
      </div>

      {/* Footer */}
      {phase === "checked" && result ? (
        <FeedbackBar isCorrect={result.is_correct} correctAnswer={result.correct_answer} onContinue={handleContinue} />
      ) : (
        <div className="fixed bottom-0 left-0 right-0 border-t-2 border-line bg-bg">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <button onClick={handleSkip} className="btn-duo-ghost px-8 py-3">Skip</button>
            <button disabled={isAnswerEmpty(answer)} onClick={handleCheck} className="btn-duo-green px-10 py-3">
              Check
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function labelFor(type: string): string {
  switch (type) {
    case "multiple_choice": return "Select the correct answer";
    case "translate": return "Tap the words in order";
    case "match": return "Match the pairs";
    case "fill_blank": return "Fill in the blank";
    case "type_answer": return "Type the answer";
    default: return "Exercise";
  }
}

/** Speak the Spanish content where the prompt contains it; otherwise speak the prompt. */
function ttsTextFor(type: string, prompt: string): string {
  const quoted = prompt.match(/'([^']+)'/);
  return quoted ? quoted[1] : prompt;
}
