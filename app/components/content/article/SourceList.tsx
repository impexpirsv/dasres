import type { ContentSource } from "../../../../lib/content";

export default function SourceList({ primarySources, references, title, locale }: { primarySources: readonly ContentSource[]; references: readonly ContentSource[]; title: string; locale: string }) {
  const sources = [...primarySources, ...references];
  if (sources.length === 0) return null;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return <section className="article-sources"><h2 className="text-2xl font-bold text-white">{title}</h2><ol className="mt-5 space-y-3">{sources.map((source, index) => <li key={`${source.url}-${index}`} className="ui-card p-4"><a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 hover:text-cyan-200">{source.title}</a>{source.publisher && <p className="mt-1 text-sm text-slate-300">{source.publisher}</p>}<time dateTime={source.accessedDate} className="mt-1 block text-xs text-slate-400">{date.format(new Date(source.accessedDate))}</time></li>)}</ol></section>;
}
