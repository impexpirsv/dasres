"use client";

import {
  useEffect,
  useId,
  useRef,
} from "react";

type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function Modal({
  open,
  title,
  children,
  onClose,
}: ModalProps) {
  const titleId = useId();

  const dialogRef =
    useRef<HTMLDivElement>(null);

  const previouslyFocusedElementRef =
    useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const focusableElements =
      dialogRef.current?.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTOR,
      );

    const firstFocusableElement =
      focusableElements?.[0];

    window.requestAnimationFrame(() => {
      if (firstFocusableElement) {
        firstFocusableElement.focus();
        return;
      }

      dialogRef.current?.focus();
    });

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentFocusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        );

      if (
        !currentFocusableElements ||
        currentFocusableElements.length === 0
      ) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement =
        currentFocusableElements[0];

      const lastElement =
        currentFocusableElements[
          currentFocusableElements.length - 1
        ];

      const activeElement =
        document.activeElement;

      if (
        event.shiftKey &&
        activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (
        !event.shiftKey &&
        activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      window.requestAnimationFrame(() => {
        previouslyFocusedElementRef.current?.focus();
      });
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="ui-card max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-slate-950 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2
            id={titleId}
            className="min-w-0 break-words text-2xl font-bold text-white"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="ui-button ui-button-ghost min-h-10 shrink-0 px-3 py-2 text-sm"
          >
            <span aria-hidden="true">
              ✕
            </span>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
