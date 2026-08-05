import type { ReactNode } from "react";
import type { ArticleCalloutKind } from "./article-content";

const styles: Record<ArticleCalloutKind, string> = {
  note: "border-blue-400/35 bg-blue-400/10 text-blue-100",
  warning: "border-amber-400/40 bg-amber-400/10 text-amber-50",
  tip: "border-emerald-400/35 bg-emerald-400/10 text-emerald-50",
  definition: "border-violet-400/35 bg-violet-400/10 text-violet-50",
};

export default function Callout({ kind, title, children }: { kind: ArticleCalloutKind; title: string | null; children: ReactNode }) {
  return <aside role={kind === "warning" ? "alert" : "note"} className={`article-callout ${styles[kind]}`}><span className="article-callout-mark" aria-hidden="true">{kind === "warning" ? "!" : kind === "tip" ? "✓" : kind === "definition" ? "=" : "i"}</span><div>{title && <p className="font-bold text-current">{title}</p>}<div className={title ? "mt-2" : ""}>{children}</div></div></aside>;
}
