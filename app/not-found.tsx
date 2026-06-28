import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <div className="text-7xl mb-6">🧭</div>

        <p className="text-blue-400 font-semibold mb-3">
          Page Not Found
        </p>

        <h1 className="text-5xl md:text-6xl font-black mb-6">
          This page does not exist.
        </h1>

        <p className="text-slate-400 text-lg leading-8 mb-10">
          The page you are looking for may have been moved, deleted or does not
          exist in Dasres.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
          >
            Go Home
          </Link>

          <Link
            href="/dashboard"
            className="border border-slate-700 hover:border-blue-500 bg-slate-900 px-6 py-3 rounded-xl font-semibold"
          >
            Go Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}