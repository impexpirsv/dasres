import StatusBadge, {
  type Status,
} from "../StatusBadge";
import { getTranslations } from "next-intl/server";

export default async function ProjectHeader({
  status,
  title,
  description,
  progress,
}: {
  status: string;
  title: string;
  description: string;
  progress: number;
}) {
  const t = await getTranslations("projectHeader");

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-4">
            <StatusBadge status={status as Status} />
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>

          <p className="max-w-2xl leading-7 text-slate-400">
            {description}
          </p>
        </div>

        <div className="min-w-56 rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-sm text-slate-500">
            {t("progress")}
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-400">
            {progress}%
          </p>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}