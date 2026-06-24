"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { getTranslation } from "../hooks/useLanguage";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = mounted
    ? getTranslation()
    : {
        dashboard: "Dashboard",
        home: "Home",
        experts: "Experts",
        companies: "Companies",
        opportunities: "Opportunities",
        login: "Login",
      };

  const navLinks = [
    { href: "/", label: t.home },
    { href: "/experts", label: t.experts },
    { href: "/companies", label: t.companies },
    { href: "/opportunities", label: t.opportunities },
    { href: "/dashboard/top-experts", label: "Top Experts" },
    { href: "/dashboard/top-companies", label: "Top Companies" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="group">
          <div className="text-2xl font-black tracking-wider text-white">
            DASRES
          </div>

          <div className="text-xs text-slate-500 group-hover:text-blue-400 transition">
            Trust Ecosystem for Global Trade
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-7 text-sm text-slate-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white transition"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-4 py-2 hover:border-blue-500 hover:text-white transition"
          >
            {t.dashboard}
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />

          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-white transition"
          >
            {t.login}
          </Link>

          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl text-white font-semibold shadow-lg shadow-blue-600/20"
          >
            Join
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((value) => !value)}
          className="lg:hidden rounded-xl border border-slate-700 px-3 py-2 text-slate-200"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

     {menuOpen && (
  <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-6 py-5">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-2.5 text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              {t.dashboard}
            </Link>

            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              {t.login}
            </Link>

            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white"
            >
              Join Dasres
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}