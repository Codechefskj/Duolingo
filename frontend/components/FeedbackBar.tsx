"use client";

export default function FeedbackBar({
  isCorrect,
  correctAnswer,
  onContinue,
}: {
  isCorrect: boolean;
  correctAnswer: unknown;
  onContinue: () => void;
}) {
  const displayAnswer = Array.isArray(correctAnswer)
    ? (correctAnswer as unknown[])
        .map((v) => (Array.isArray(v) ? (v as string[]).join(" → ") : String(v)))
        .join(Array.isArray((correctAnswer as unknown[])[0]) ? ", " : " ")
    : String(correctAnswer);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 border-t-2 animate-slide-up
        ${isCorrect ? "border-duo-green" : "border-duo-red"}`}
      style={{ background: isCorrect ? "var(--correct-bg)" : "var(--wrong-bg)" }}
    >
      <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-extrabold
              ${isCorrect ? "bg-duo-green text-[#131f24]" : "bg-duo-red text-white"}`}
          >
            {isCorrect ? "✓" : "✕"}
          </span>
          <div>
            <p className={`font-extrabold text-lg ${isCorrect ? "text-duo-green" : "text-duo-red"}`}>
              {isCorrect ? "Nicely done!" : "Correct solution:"}
            </p>
            {!isCorrect && <p className="font-bold">{displayAnswer}</p>}
            {!isCorrect && (
              <button className="text-duo-red/80 text-xs font-extrabold uppercase mt-1 flex items-center gap-1">
                ⚑ Report
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onContinue}
          className={isCorrect ? "btn-duo-green px-8 py-3" : "btn-duo-red px-8 py-3"}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
