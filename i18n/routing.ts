import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "../lib/locale";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    path: "/",
    sameSite: "lax",
    maxAge: 31_536_000,
    secure: false,
  },
  alternateLinks: false,
});
