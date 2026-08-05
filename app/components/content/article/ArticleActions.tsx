"use client";

import { useEffect, useState } from "react";

export default function ArticleActions({ articleTitle, printLabel, copyLabel }: { articleTitle: string; printLabel: string; copyLabel: string }) {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let frame = 0;
    function updateProgress() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const article = document.getElementById("article-content");
        if (!article) return;
        const rect = article.getBoundingClientRect();
        const available = Math.max(1, article.offsetHeight - window.innerHeight * 0.55);
        setProgress(Math.min(100, Math.max(0, ((window.innerHeight * 0.28 - rect.top) / available) * 100)));
      });
    }
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", updateProgress); window.removeEventListener("resize", updateProgress); };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <progress className="article-progress" max={100} value={progress} aria-label={articleTitle}>{Math.round(progress)}%</progress>
        <p className="mt-2 text-end text-xs font-semibold tabular-nums text-slate-400" aria-hidden="true">{Math.round(progress)}%</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="ui-button ui-button-outline min-w-0 px-3 text-sm" onClick={() => window.print()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7v-7Z" /></svg>
          <span className="truncate">{printLabel}</span>
        </button>
        <button type="button" className="ui-button ui-button-outline min-w-0 px-3 text-sm" onClick={copyLink} aria-live="polite">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{copied ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>}</svg>
          <span className="truncate">{copyLabel}</span>
        </button>
      </div>
    </div>
  );
}
