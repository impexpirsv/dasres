import Link from "next/link";
import type { ReactNode } from "react";

import Footer from "../Footer";
import Navbar from "../Navbar";
import { getCurrentUser } from "../../../lib/auth";

type Breadcrumb = {
  href?: string;
  label: string;
};

export async function PublicPageShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar isAuthenticated={user !== null} />
      <main>{children}</main>
      <Footer year={year} />
    </div>
  );
}

export function PublicPageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
}: {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs: Breadcrumb[];
}) {
  return (
    <header className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.2),transparent_55%)]">
      <div className="ui-container py-14 sm:py-20 lg:py-24">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            {breadcrumbs.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                {item.href ? (
                  <Link className="rounded-sm transition hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400" href={item.href}>
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-slate-200">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
        <h1 className="max-w-4xl break-words text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-slate-300">{description}</p>
      </div>
    </header>
  );
}

export function PublicSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="ui-section-compact">
      <div className="ui-container">
        <h2 className="max-w-4xl break-words text-2xl font-bold leading-tight text-white sm:text-3xl">{title}</h2>
        {description && <p className="mt-4 max-w-4xl text-base leading-8 text-slate-400 sm:text-lg">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function PublicCardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function PublicContentCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="ui-card">
      <h3 className="break-words text-xl font-bold text-slate-100">{title}</h3>
      <p className="mt-3 break-words leading-7 text-slate-400">{description}</p>
    </article>
  );
}

export function PublicCta({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return (
    <section className="ui-container ui-section-compact">
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-blue-600/20 via-slate-900 to-emerald-500/10 p-8 sm:p-10">
        <h2 className="text-2xl font-black sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">{description}</p>
        <Link href={href} className="ui-button ui-button-primary mt-6">
          {label}
        </Link>
      </div>
    </section>
  );
}
