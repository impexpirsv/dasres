"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export default function Modal({
  open,
  title,
  children,
  onClose,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl scale-100 rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl transition-all duration-200 ease-out animate-in fade-in zoom-in-95"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}