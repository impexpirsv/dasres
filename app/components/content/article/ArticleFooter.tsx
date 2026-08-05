import type { ContentRecord } from "../../../../lib/content";
import RelatedArticles from "./RelatedArticles";
import SourceList from "./SourceList";

export default function ArticleFooter({ article, related, relatedTitle, sourcesTitle, locale }: { article: ContentRecord; related: readonly ContentRecord[]; relatedTitle: string; sourcesTitle: string; locale: string }) {
  return <footer className="article-footer mt-14 space-y-12 border-t border-slate-800 pt-10"><SourceList primarySources={article.primarySources} references={article.references} title={sourcesTitle} locale={locale} />{article.tags.length > 0 && <ul className="flex flex-wrap gap-2" aria-label={article.title}>{article.tags.map((tag) => <li key={tag} className="ui-badge border-slate-700 bg-slate-900 text-slate-300">{tag}</li>)}</ul>}<RelatedArticles articles={related} title={relatedTitle} /></footer>;
}
