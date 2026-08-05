import Image from "next/image";
import Link from "next/link";
import type { ContentBreadcrumb, ContentRecord } from "../../../../lib/content";
import ArticleMeta from "./ArticleMeta";

export default function ArticleHeader({ article, categoryTitle, breadcrumbs, locale, updatedLabel, reviewLabel }: { article: ContentRecord; categoryTitle: string; breadcrumbs: readonly ContentBreadcrumb[]; locale: string; updatedLabel: string; reviewLabel: string }) {
  return (
    <header className="article-header border-b border-slate-800/80">
      <div className="ui-container py-12 sm:py-16 lg:py-20">
        <nav aria-label={article.title} className="mb-8 overflow-hidden"><ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-slate-400">{breadcrumbs.map((item, index) => <li key={item.pathname} className="flex min-w-0 items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{index === breadcrumbs.length - 1 ? <span aria-current="page" className="max-w-64 truncate text-slate-200">{item.name}</span> : <Link href={item.pathname} className="rounded hover:text-cyan-300">{item.name}</Link>}</li>)}</ol></nav>
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)]">
          <div className="min-w-0">
            <Link href={breadcrumbs[2]?.pathname ?? "/resources"} className="ui-badge border-cyan-400/30 bg-cyan-400/10 text-cyan-200">{categoryTitle}</Link>
            <h1 className="mt-6 max-w-5xl break-words text-balance text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-white">{article.title}</h1>
            <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">{article.summary}</p>
            <ArticleMeta article={article} locale={locale} updatedLabel={updatedLabel} reviewLabel={reviewLabel} />
          </div>
          {article.coverImage && <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--ui-radius-panel)] border border-slate-700/70 shadow-[var(--ui-shadow-elevated)]"><Image src={article.coverImage} alt="" fill sizes="(min-width: 1024px) 448px, 100vw" className="object-cover" priority /></div>}
        </div>
      </div>
    </header>
  );
}
