import Link from "next/link";
import type { ContentRecord } from "../../../../lib/content";
import ArticleActions from "./ArticleActions";
import type { ArticleHeading } from "./article-content";

function SidebarContent({ article, headings, related, printLabel, copyLabel }: { article: ContentRecord; headings: readonly ArticleHeading[]; related: readonly ContentRecord[]; printLabel: string; copyLabel: string }) {
  return <div className="space-y-6"><ArticleActions articleTitle={article.title} printLabel={printLabel} copyLabel={copyLabel} />{headings.length > 0 && <nav aria-label={article.title}><ol className="space-y-1 border-s border-slate-700/70 ps-4">{headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? "ps-3" : ""}><a href={`#${heading.id}`} className="block rounded py-1.5 text-sm leading-5 text-slate-400 hover:text-cyan-200">{heading.text}</a></li>)}</ol></nav>}{related.length > 0 && <div className="space-y-2">{related.slice(0, 3).map((item) => <Link key={item.id} href={item.canonical} className="block rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm font-semibold leading-5 text-slate-300 transition hover:border-cyan-400/40 hover:text-white">{item.title}</Link>)}</div>}</div>;
}

export default function ArticleSidebar(props: { article: ContentRecord; headings: readonly ArticleHeading[]; related: readonly ContentRecord[]; printLabel: string; copyLabel: string }) {
  return <><details className="ui-card mb-8 lg:hidden"><summary className="cursor-pointer list-none font-bold text-white">{props.article.title}</summary><div className="mt-5 border-t border-slate-800 pt-5"><SidebarContent {...props} /></div></details><aside className="article-sidebar hidden lg:block"><div className="ui-card sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto"><SidebarContent {...props} /></div></aside></>;
}
