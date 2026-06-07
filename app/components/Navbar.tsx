"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher.tsx";
import { getTranslation } from "../hooks/useLanguage";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);

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

  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-bold text-white"
        >
          DASRES
        </Link>

        <div className="hidden md:flex gap-8 text-slate-300">
          <Link href="/dashboard">
            {t.dashboard}
          </Link>

          <Link href="/">
            {t.home}
          </Link>

          <Link href="/experts">
            {t.experts}
          </Link>

          <Link href="/companies">
            {t.companies}
          </Link>

          <Link href="/opportunities">
            {t.opportunities}
          </Link>

          <Link href="/login">
            {t.login}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white"
          >
            Join
          </Link>
        </div>
      </div>
    </nav>
  );
}