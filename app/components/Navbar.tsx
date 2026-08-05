"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { getLocalizedPublicPathLocale } from "../../lib/locale";
import LanguageSwitcher from "./LanguageSwitcher";

const publicLinks = [
  ["/companies", "companies"],
  ["/experts", "experts"],
  ["/opportunities", "opportunities"],
  ["/pricing", "pricing"],
  ["/resources", "resources"],
  ["/about", "about"],
] as const;

export default function Navbar({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const t = useTranslations("publicSite.navigation");
  const footerT = useTranslations("publicSite.footer");
  const pathname = usePathname();
  const homepageLocale = getLocalizedPublicPathLocale(pathname);
  const homepageHref = homepageLocale ? `/${homepageLocale}` : "/";
  const resolvePublicHref = (href: string) =>
    homepageLocale && href === "/companies"
      ? `/${homepageLocale}/companies`
      : href;
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLElement>("a[href], select, button")
        ?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !navRef.current?.contains(event.target)
      ) {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }

  function linkClass(href: string) {
    const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
    return `rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${active ? "bg-blue-500/10 text-cyan-300" : "text-slate-300 hover:bg-slate-900 hover:text-white"}`;
  }

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/90 backdrop-blur-2xl" aria-label={t("primaryLabel")}>
      <div className="ui-container flex min-h-20 items-center justify-between gap-3">
        <Link href={homepageHref} aria-label={t("brandHomeLabel")} className="group flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-400 text-lg font-black text-white shadow-lg shadow-blue-500/20">D</span>
          <span className="min-w-0">
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-xl font-black tracking-[0.14em] text-transparent">DASRES</span>
            <span className="hidden truncate text-xs text-slate-500 sm:block">{t("tagline")}</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          {publicLinks.map(([href, key]) => { const resolvedHref = resolvePublicHref(href); return <Link key={href} href={resolvedHref} className={linkClass(resolvedHref)}>{t(key)}</Link>; })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher ariaLabel={footerT("languageLabel")} />
          {isAuthenticated ? (
            <Link href="/dashboard" className="ui-button ui-button-primary text-sm">{footerT("links.dashboard")}</Link>
          ) : (
            <>
              <Link href="/login" className="ui-button ui-button-ghost px-3 text-sm">{t("login")}</Link>
              <Link href="/register" className="ui-button ui-button-primary text-sm">{t("join")}</Link>
            </>
          )}
        </div>

        <button ref={toggleRef} type="button" onClick={() => menuOpen ? closeMenu() : setMenuOpen(true)} aria-label={t("toggleMenu")} aria-expanded={menuOpen} aria-controls="mobile-navigation-menu" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline-2 focus-visible:outline-cyan-400 xl:hidden">
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        </button>
      </div>

      {menuOpen && (
        <div ref={menuRef} id="mobile-navigation-menu" className="border-t border-slate-800 bg-slate-950 p-5 xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <div className="mb-2 lg:hidden"><LanguageSwitcher ariaLabel={footerT("languageLabel")} onLocaleChange={closeMenu} /></div>
            {publicLinks.map(([href, key]) => { const resolvedHref = resolvePublicHref(href); return <Link key={href} href={resolvedHref} onClick={closeMenu} className={linkClass(resolvedHref)}>{t(key)}</Link>; })}
            <Link href="/contact" onClick={closeMenu} className={linkClass("/contact")}>{t("contact")}</Link>
            <Link href="/help" onClick={closeMenu} className={linkClass("/help")}>{t("help")}</Link>
            <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-800 pt-4 lg:hidden">
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={closeMenu} className="ui-button ui-button-primary">{footerT("links.dashboard")}</Link>
              ) : (
                <>
                  <Link href="/login" onClick={closeMenu} className={linkClass("/login")}>{t("login")}</Link>
                  <Link href="/register" onClick={closeMenu} className="ui-button ui-button-primary">{t("join")}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
