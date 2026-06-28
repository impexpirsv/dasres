import Link from "next/link";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description: string;
  buttonText?: string;
  href?: string;
};

export default function EmptyState({
 icon = "📭",
  title,
  description,
  buttonText,
  href,
}: EmptyStateProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-14 text-center">
      <div className="text-6xl mb-6">
        {icon}
      </div>

      <h2 className="text-3xl font-bold mb-4">
        {title}
      </h2>

      <p className="text-slate-400 max-w-xl mx-auto leading-7">
        {description}
      </p>

      {buttonText && href && (
        <Link
          href={href}
          className="inline-block mt-8 bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-xl font-semibold"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}