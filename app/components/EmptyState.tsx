import Link from "next/link";
import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
};

export default function EmptyState({
  icon = "📭",
  title,
  description,
  buttonText,
  buttonHref,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900 px-8 py-16 text-center">
      <div className="mb-5 text-5xl">{icon}</div>

      <h2 className="mb-4 text-3xl font-bold tracking-tight text-white">
        {title}
      </h2>

      <p className="mx-auto max-w-xl leading-7 text-slate-400">
        {description}
      </p>

      {buttonText && buttonHref && (
        <Link
          href={buttonHref}
          className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}