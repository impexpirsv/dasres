import { notFound } from "next/navigation";

import { isLocale } from "../../../lib/locale";
import HelpPage, { createHelpMetadata } from "../../help/page";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return createHelpMetadata({ routeLocale: locale, localized: true });
}

export default async function LocalizedHelpPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return HelpPage({ routeLocale: locale, localized: true });
}
