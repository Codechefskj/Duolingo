"use client";

export default function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-sm animate-pop-in">{children}</div>
    </div>
  );
}
