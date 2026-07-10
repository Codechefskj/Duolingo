"use client";

export default function MultipleChoice({
  options, value, onChange, locked,
}: {
  options: { choices: string[] };
  value: string | null;
  onChange: (v: string) => void;
  locked: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 max-w-xl mx-auto w-full">
      {options.choices.map((choice, i) => (
        <button
          key={choice}
          disabled={locked}
          onClick={() => onChange(choice)}
          className={`choice-duo px-4 py-4 text-left flex items-center gap-4 ${value === choice ? "choice-selected" : ""}`}
        >
          <span className={`w-7 h-7 rounded-lg border-2 text-xs flex items-center justify-center font-extrabold
            ${value === choice ? "border-duo-blue text-duo-blue" : "border-line text-mut"}`}>
            {i + 1}
          </span>
          {choice}
        </button>
      ))}
    </div>
  );
}
