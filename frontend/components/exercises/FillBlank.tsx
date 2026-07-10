"use client";

export default function FillBlank({
  options, value, onChange, locked,
}: {
  options: { sentence: string };
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
}) {
  const [before, after] = options.sentence.split("___");
  return (
    <div className="max-w-xl mx-auto w-full flex items-center flex-wrap gap-2 text-xl font-bold justify-center">
      <span className="border-b-2 border-dashed border-line pb-1">{before}</span>
      <input
        autoFocus disabled={locked} value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="border-b-2 border-duo-blue bg-transparent outline-none text-center w-32 py-1 text-duo-blue"
        placeholder="…"
      />
      <span className="border-b-2 border-dashed border-line pb-1">{after}</span>
    </div>
  );
}
