import Link from "next/link";

type DirectoryCardProps = {
  href: string;
  title: string;
  subtitle: string;
  location?: string;
  description: string;
  status?: string;
};

export default function DirectoryCard({
  href,
  title,
  subtitle,
  location,
  description,
  status,
}: DirectoryCardProps) {
  return (
    <Link
      href={href}
      className="block bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:bg-slate-800 transition"
    >
      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      <p className="text-blue-400 mt-2">
        {subtitle}
      </p>

      {location && (
        <p className="text-slate-400 mt-2">
          {location}
        </p>
      )}

      <p className="text-slate-400 mt-4">
        {description}
      </p>

      {status && (
        <div className="mt-4 text-green-400">
          {status}
        </div>
      )}
    </Link>
  );
}