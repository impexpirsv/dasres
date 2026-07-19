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
    {
      href: "/dashboard/top-experts",
      label: t("topExperts"),
    },
    {
      href: "/dashboard/top-companies",
      label: t("topCompanies"),
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-2xl">

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        <Link
          href="/"
          className="group flex flex-col"
        >
          <span
            className="
              bg-gradient-to-r
              from-blue-400
              via-cyan-400
              to-emerald-400
              bg-clip-text
              text-2xl
              font-black
              tracking-[0.2em]
              text-transparent
              transition
              group-hover:scale-105
              md:text-3xl
            "
          >
            DASRES
          </span>

          <span className="text-xs text-slate-500 transition group-hover:text-cyan-400">
            {t("tagline")}
          </span>
        </Link>



        <div className="hidden items-center gap-7 lg:flex">

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="
                text-sm
                font-medium
                text-slate-400
                transition
                hover:text-white
              "
            >
              {link.label}
            </Link>
          ))}


          <Link
            href="/dashboard"
            className="
              rounded-full
              border
              border-slate-700
              bg-slate-900/70
              px-5
              py-2
              text-sm
              font-semibold
              text-slate-200
              transition
              hover:border-blue-500
              hover:bg-blue-500/10
              hover:text-white
            "
          >
            {t("dashboard")}
          </Link>

        </div>




        <div className="hidden items-center gap-5 md:flex">

          <LanguageSwitcher />


          <Link
            href="/login"
            className="
              text-sm
              font-medium
              text-slate-400
              transition
              hover:text-white
            "
          >
            {t("login")}
          </Link>



          <Link
            href="/register"
            className="
              rounded-xl
              bg-gradient-to-r
              from-blue-600
              to-cyan-600
              px-6
              py-3
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-blue-600/20
              transition
              hover:scale-[1.03]
              hover:shadow-blue-500/40
            "
          >
            {t("join")}
          </Link>

        </div>




        <button
          type="button"
          onClick={() =>
            setMenuOpen((value) => !value)
          }
          aria-label={t("toggleMenu")}
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-900
            px-3
            py-2
            text-slate-200
            transition
            hover:border-blue-500
            lg:hidden
          "
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>




      {menuOpen && (

        <div
          className="
            border-t
            border-slate-800
            bg-slate-950/95
            px-6
            py-5
            backdrop-blur-xl
            lg:hidden
          "
        >

          <div className="flex flex-col gap-2">

            <LanguageSwitcher />


            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() =>
                  setMenuOpen(false)
                }
                className="
                  rounded-xl
                  px-4
                  py-3
                  text-slate-300
                  transition
                  hover:bg-slate-900
                  hover:text-white
                "
              >
                {link.label}
              </Link>
            ))}



            <Link
              href="/dashboard"
              onClick={() =>
                setMenuOpen(false)
              }
              className="
                rounded-xl
                px-4
                py-3
                text-slate-300
                transition
                hover:bg-slate-900
                hover:text-white
              "
            >
              {t("dashboard")}
            </Link>



            <Link
              href="/login"
              onClick={() =>
                setMenuOpen(false)
              }
              className="
                rounded-xl
                px-4
                py-3
                text-slate-300
                transition
                hover:bg-slate-900
                hover:text-white
              "
            >
              {t("login")}
            </Link>



            <Link
              href="/register"
              onClick={() =>
                setMenuOpen(false)
              }
              className="
                rounded-xl
                bg-gradient-to-r
                from-blue-600
                to-cyan-600
                px-4
                py-3
                text-center
                font-bold
                text-white
              "
            >
              {t("joinDasres")}
            </Link>


          </div>

        </div>

      )}

    </nav>
  );
}