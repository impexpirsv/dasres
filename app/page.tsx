import { getLocale } from "next-intl/server";

import { defaultLocale, isLocale } from "../lib/locale";
import Homepage from "./components/homepage/Homepage";

export const revalidate = 300;

export default async function Home() {
  const requestedLocale = await getLocale();
  const locale = isLocale(requestedLocale)
    ? requestedLocale
    : defaultLocale;

  return <Homepage locale={locale} localized={false} />;
}
