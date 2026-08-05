"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";

interface MobileDashboardMenuProps {
  isAdmin: boolean;
  unreadNotificationsCount: number;
}

const FOCUSABLE_ELEMENT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function MobileDashboardMenu({
  isAdmin,
  unreadNotificationsCount,
}: MobileDashboardMenuProps) {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const t = useTranslations(
    "dashboardSidebar",
  );

  const openButtonRef =
    useRef<HTMLButtonElement>(null);

  const drawerRef =
    useRef<HTMLDivElement>(null);

  function closeMenu({
    restoreFocus = true,
  }: {
    restoreFocus?: boolean;
  } = {}) {
    setOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        openButtonRef.current?.focus();
      });
    }
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusableElements =
      drawerRef.current?.querySelectorAll<HTMLElement>(
        FOCUSABLE_ELEMENT_SELECTOR,
      );

    focusableElements?.[0]?.focus();

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentFocusableElements =
        drawerRef.current?.querySelectorAll<HTMLElement>(
          FOCUSABLE_ELEMENT_SELECTOR,
        );

      if (
        !currentFocusableElements ||
        currentFocusableElements.length === 0
      ) {
        event.preventDefault();
        return;
      }

      const firstElement =
        currentFocusableElements[0];

      const lastElement =
        currentFocusableElements[
          currentFocusableElements.length - 1
        ];

      const activeElement =
        document.activeElement;

      if (
        event.shiftKey &&
        activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (
        !event.shiftKey &&
        activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 p-3 backdrop-blur lg:hidden">
        <button
          ref={openButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-dashboard-menu"
          className="
            inline-flex
            min-h-11
            items-center
            gap-2
            rounded-xl
            border
            border-slate-700
            bg-slate-900
            px-4
            py-2
            text-sm
            font-medium
            text-white
            transition
            hover:border-slate-600
            hover:bg-slate-800
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-cyan-500
            focus-visible:ring-offset-2
            focus-visible:ring-offset-slate-950
          "
        >
          <span aria-hidden="true">
            ☰
          </span>

          <span>{t("menu")}</span>
        </button>
      </div>

      {open && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label={t("menu")}
            className="
              fixed
              inset-0
              z-40
              cursor-default
              bg-black/70
              backdrop-blur-sm
            "
            onClick={() => closeMenu()}
          />

          <div
            id="mobile-dashboard-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("menu")}
            className="
              fixed
              inset-y-0
              start-0
              z-50
              w-80
              max-w-[calc(100vw-2rem)]
              overflow-y-auto
              bg-slate-950
              shadow-2xl
              shadow-black/50
            "
          >
            <div className="absolute end-3 top-3 z-10">
              <button
                type="button"
                onClick={() => closeMenu()}
                aria-label={t("menu")}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-900
                  text-xl
                  text-slate-300
                  transition
                  hover:bg-slate-800
                  hover:text-white
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-cyan-500
                "
              >
                <span aria-hidden="true">
                  ×
                </span>
              </button>
            </div>

            <DashboardSidebar
              isAdmin={isAdmin}
              unreadNotificationsCount={
                unreadNotificationsCount
              }
              mobileOpen
              onNavigate={() =>
                closeMenu({
                  restoreFocus: false,
                })
              }
            />
          </div>
        </div>
      )}
    </>
  );
}
