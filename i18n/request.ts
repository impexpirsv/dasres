import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  resolveLocale,
} from "../lib/locale";

const LOCALE_COOKIE = "NEXT_LOCALE";

export default getRequestConfig(async ({ requestLocale }) => {
  const routeLocale = await requestLocale;
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  const locale = resolveLocale(routeLocale, savedLocale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
