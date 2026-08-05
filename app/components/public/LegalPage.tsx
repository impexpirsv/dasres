import type { ReactNode } from "react";

import { PublicPageHero, PublicPageShell } from "./PublicPage";

export function LegalPage({
  homeLabel,
  eyebrow,
  title,
  description,
  reviewNotice,
  children,
}: {
  homeLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  reviewNotice: string;
  children: ReactNode;
}) {
  return (
    <PublicPageShell>
      <PublicPageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={[{ href: "/", label: homeLabel }, { label: title }]}
      />
      <div className="mx-auto max-w-4xl px-6 py-14">
        <aside className="mb-10 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 leading-7 text-amber-100" role="note">
          {reviewNotice}
        </aside>
        <div className="space-y-10">{children}</div>
      </div>
    </PublicPageShell>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div className="mt-4 space-y-4 leading-8 text-slate-300">{children}</div>
    </section>
  );
}
