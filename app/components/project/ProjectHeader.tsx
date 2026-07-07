export default function ProjectHeader({
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
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <span className="inline-block bg-blue-600/20 text-blue-300 border border-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            {status}
          </span>

         <h1 className="text-3xl font-bold mb-2">{title}</h1>

          <p className="max-w-2xl text-sm text-slate-400">{description}</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 min-w-56">
          <p className="text-slate-500 text-sm">Progress</p>

          <p className="mt-2 text-3xl font-bold text-blue-400">
            {progress}%
          </p>

          <div className="h-3 bg-slate-800 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-blue-500 rounded-full"
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