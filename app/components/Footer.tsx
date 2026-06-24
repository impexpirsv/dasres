import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid md:grid-cols-4 gap-12">

          <div>
            <h2 className="text-3xl font-bold mb-4">
              DASRES
            </h2>

            <p className="text-slate-400 leading-7">
              Trust Ecosystem for Global Trade.
              Connecting companies, experts and
              opportunities through one trusted
              international platform.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-5">
              Platform
            </h3>

            <div className="flex flex-col gap-3 text-slate-400">
              <Link href="/experts">
                Experts
              </Link>

              <Link href="/companies">
                Companies
              </Link>

              <Link href="/opportunities">
                Opportunities
              </Link>

              <Link href="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-5">
              Network
            </h3>

            <div className="flex flex-col gap-3 text-slate-400">
              <Link href="/top-experts">
                Top Experts
              </Link>

              <Link href="/top-companies">
                Top Companies
              </Link>

              <Link href="/open-cases">
                Open Cases
              </Link>

              <Link href="/tickets">
                Support
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-5">
              Platform Stats
            </h3>

            <div className="space-y-3 text-slate-400">
              <p>✓ Verified Companies</p>
              <p>✓ Trusted Experts</p>
              <p>✓ Trade Opportunities</p>
              <p>✓ Global Trade Network</p>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-14 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">

          <p className="text-slate-500 text-sm">
            © 2026 Dasres. All rights reserved.
          </p>

          <div className="flex gap-6 text-slate-500 text-sm">
            <span>English</span>
            <span>Persian</span>
            <span>Arabic (Coming Soon)</span>
          </div>

        </div>

      </div>
    </footer>
  );
}