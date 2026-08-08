import Link from "next/link";
import type { ContentRecord } from "../../../../lib/content";

export default function RelatedArticles({ articles, title, resourcesPath = "/resources" }: { articles: readonly ContentRecord[]; title: string; resourcesPath?: string }) {
  if (articles.length === 0) return null;
  return <section className="article-footer-related"><h2 className="text-xl font-bold text-white">{title}</h2><div className="mt-4 grid gap-3">{articles.map((article) => <Link key={article.id} href={`${resourcesPath}/${article.canonical.split("/")[2]}/${article.slug}`} className="ui-card ui-card-interactive block p-4"><h3 className="font-bold leading-6 text-white">{article.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{article.excerpt}</p></Link>)}</div></section>;
}
