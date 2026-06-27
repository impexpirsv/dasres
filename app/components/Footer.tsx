import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 border-t border-slate-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_32%)]" />

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-8 md:p-10 mb-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <p className="text-blue-400 font-semibold mb-3">
                Ready to manage trade with confidence?
              </p>

              <h2 className="text-3xl md:text-5xl font-black">
                Start your first Dasres trade case.
              </h2>

              <p className="text-slate-400 mt-4 max-w-2xl leading-7">
                Create a case, compare verified providers and manage proposals,
                documents and communication in one trusted workflow.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard/cases/new"
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold text-center"
              >
                Create Case
              </Link>

              <Link
                href="/companies"
                className="border border-slate-700 hover:border-cyan-500 bg-slate-950 px-6 py-3 rounded-xl font-semibold text-center"
              >
                Explore Network
              </Link>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <h2 className="text-3xl font-black mb-4">
              DASRES
            </h2>

            <p className="text-slate-400 leading-7">
              Case-based trust ecosystem for international trade services,
              verified providers, proposals, documents and reputation.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-5">
              Platform
            </h3>

            <div className="flex flex-col gap-3 text-slate-400">
              <Link href="/companies" className="hover:text-blue-300">
                Companies
              </Link>

              <Link href="/experts" className="hover:text-blue-300">
                Experts
              </Link>

              <Link href="/opportunities" className="hover:text-blue-300">
                Opportunities
              </Link>

              <Link href="/dashboard" className="hover:text-blue-300">
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-5">
              Network
            </h3>

            <div className="flex flex-col gap-3 text-slate-400">
              <Link href="/top-companies" className="hover:text-blue-300">
                Top Companies
              </Link>

              <Link href="/top-experts" className="hover:text-blue-300">
                Top Experts
              </Link>

              <Link href="/dashboard/open-cases" className="hover:text-blue-300">
                Open Cases
              </Link>

              <Link href="/dashboard/tickets" className="hover:text-blue-300">
                Support Tickets
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-5">
              Trust Signals
            </h3>

            <div className="space-y-3 text-slate-400">
              <p>✓ Verified companies</p>
              <p>✓ Trusted experts</p>
              <p>✓ Proposal workflow</p>
              <p>✓ Reviews and reputation</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-14 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 Dasres. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-5 text-slate-500 text-sm">
            <span>English</span>
            <span>Persian soon</span>
            <span>Arabic soon</span>
          </div>
        </div>
      </div>
    </footer>
  );
}