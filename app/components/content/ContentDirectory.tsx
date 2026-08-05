import Link from "next/link";
import type { ReactNode } from "react";
import type { ContentRecord, KnowledgeCategory } from "../../../lib/content";

export function ContentNavigation({ items, current, ariaLabel }: { items: readonly { href: string; label: string }[]; current?: string; ariaLabel: string }) {
  return <nav aria-label={ariaLabel} className="flex flex-wrap gap-2">{items.map((item) => <Link key={item.href} href={item.href} aria-current={item.href === current ? "page" : undefined} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300">{item.label}</Link>)}</nav>;
}

export function ContentEntry({ title, children, href, linkLabel }: { title: string; children: ReactNode; href?: string; linkLabel: string }) {
  return <article className="ui-card"><h2 className="text-xl font-bold">{title}</h2><div className="mt-3 leading-7 text-slate-300">{children}</div>{href && <Link href={href} className="ui-button ui-button-ghost mt-5 px-0 text-cyan-300">{linkLabel}</Link>}</article>;
}

export function EditorialPolicy({ title, points }: { title: string; points: readonly string[] }) {
  return <section className="ui-card border-amber-400/20 bg-amber-400/10"><h2 className="text-2xl font-bold text-amber-100">{title}</h2><ul className="mt-5 space-y-3 text-amber-50">{points.map((point) => <li key={point} className="flex gap-3"><span aria-hidden="true">•</span><span>{point}</span></li>)}</ul></section>;
}

export function ContentArticleCard({ article, category }: { article: ContentRecord; category: KnowledgeCategory }) {
  const date = new Intl.DateTimeFormat(article.locale, { dateStyle: "medium" }).format(new Date(article.updatedDate));
  const readingTime = new Intl.NumberFormat(article.locale, { style: "unit", unit: "minute", unitDisplay: "long" }).format(article.readingTime);

  return <article className="ui-card ui-card-interactive flex min-h-64 flex-col"><div className="flex flex-wrap items-center gap-2 text-xs text-slate-400"><span className="ui-badge border-cyan-400/25 bg-cyan-400/10 text-cyan-100">{category}</span><time dateTime={article.updatedDate}>{date}</time><span aria-hidden="true">·</span><span>{readingTime}</span></div><h2 className="mt-5 text-xl font-bold leading-snug sm:text-2xl"><Link href={`/resources/${category}/${article.slug}`} className="rounded text-white hover:text-cyan-200">{article.title}</Link></h2><p className="mt-3 line-clamp-3 leading-7 text-slate-300">{article.excerpt}</p><div className="mt-auto flex flex-wrap gap-2 pt-6" aria-hidden="true">{article.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{tag}</span>)}</div></article>;
}
