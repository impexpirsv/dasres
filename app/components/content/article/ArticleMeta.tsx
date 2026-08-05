import type { ContentRecord } from "../../../../lib/content";

type ArticleMetaProps = {
  article: ContentRecord;
  locale: string;
  updatedLabel: string;
  reviewLabel: string;
};

export default function ArticleMeta({ article, locale, updatedLabel, reviewLabel }: ArticleMetaProps) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const readingTime = new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay: "long" }).format(article.readingTime);

  return (
    <dl className="mt-7 flex flex-wrap gap-x-6 gap-y-4 text-sm leading-6 text-slate-300">
      <div className="flex items-center gap-2"><span aria-hidden="true">↻</span><dt className="sr-only">{updatedLabel}</dt><dd>{updatedLabel} <time dateTime={article.updatedDate}>{date.format(new Date(article.updatedDate))}</time></dd></div>
      {article.reviewDate && <div className="flex items-center gap-2"><span aria-hidden="true">✓</span><dt className="sr-only">{reviewLabel}</dt><dd>{reviewLabel} <time dateTime={article.reviewDate}>{date.format(new Date(article.reviewDate))}</time></dd></div>}
      <div className="flex items-center gap-2"><span aria-hidden="true">◷</span><dt className="sr-only">{readingTime}</dt><dd>{readingTime}</dd></div>
      <div className="flex items-center gap-2"><span aria-hidden="true">●</span><dt className="sr-only">{article.author.name}</dt><dd rel="author">{article.author.name}</dd></div>
      {article.reviewer.map((reviewer) => <div key={reviewer.id} className="flex items-center gap-2"><span className="text-emerald-300" aria-hidden="true">◆</span><dt className="sr-only">{reviewer.name}</dt><dd>{reviewer.name}</dd></div>)}
    </dl>
  );
}
