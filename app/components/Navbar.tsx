"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const t = useTranslations("navbar");
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/experts", label: t("experts") },
    { href: "/companies", label: t("companies") },
    { href: "/opportunities", label: t("opportunities") },
    { href: "/dashboard/top-experts", label: t("topExperts") },
    { href: "/dashboard/top-companies", label: t("topCompanies") },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group">
          <div className="text-2xl font-black tracking-wider text-white">
            DASRES
          </div>

          <div className="text-xs text-slate-500 transition group-hover:text-blue-400">
            {t("tagline")}
          </div>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-4 py-2 transition hover:border-blue-500 hover:text-white"
          >
            {t("dashboard")}
          </Link>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />

          <Link
            href="/login"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            {t("login")}
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          >
            {t("join")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={t("toggleMenu")}
          className="rounded-xl border border-slate-700 px-3 py-2 text-slate-200 lg:hidden"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-5 lg:hidden">
          <div className="flex flex-col gap-1">
            <div className="mb-3 md:hidden">
              <LanguageSwitcher />
            </div>

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
              {t("dashboard")}
            </Link>

            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              {t("login")}
            </Link>

            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white"
            >
              {t("joinDasres")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}