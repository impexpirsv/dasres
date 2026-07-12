import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  defaultLocale,
  isLocale,
} from "../lib/locale";

const LOCALE_COOKIE = "NEXT_LOCALE";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  const locale =
    savedLocale && isLocale(savedLocale)
      ? savedLocale
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});