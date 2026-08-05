"use client";

export type FaqItem = { question: string; answer: string; category: string };

export default function FaqList({ items }: { items: readonly FaqItem[] }) {
  return <div className="space-y-4">{items.map((item) => <details key={item.question} className="ui-card group"><summary className="cursor-pointer list-none rounded-sm font-bold text-white"><span className="text-sm font-semibold text-cyan-300">{item.category}</span><span className="mt-2 block text-lg leading-7">{item.question}</span></summary><p className="mt-4 border-t border-slate-800 pt-4 leading-7 text-slate-300">{item.answer}</p></details>)}</div>;
}
