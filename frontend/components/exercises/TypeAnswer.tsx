"use client";

export default function TypeAnswer({
  value, onChange, locked,
}: {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
}) {
  return (
    <div className="max-w-xl mx-auto w-full">
      <textarea
        autoFocus disabled={locked} value={value || ""} rows={3}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer"
        className="w-full card-duo px-4 py-3 text-lg font-bold outline-none focus:border-duo-blue resize-none bg-panel"
      />
    </div>
  );
}
