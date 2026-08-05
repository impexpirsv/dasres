import Link from "next/link";
import { ReactNode } from "react";
import { buttonClassName } from "./ui/styles";

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
    <div className="ui-card ui-empty px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-5 text-5xl" aria-hidden="true">{icon}</div>

      <h2 className="mb-4 text-3xl font-bold tracking-tight text-white">
        {title}
      </h2>

      <p className="mx-auto max-w-xl leading-7 text-slate-400">
        {description}
      </p>

      {buttonText && buttonHref && (
        <Link
          href={buttonHref}
          className={buttonClassName("primary", "mt-8")}
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}
