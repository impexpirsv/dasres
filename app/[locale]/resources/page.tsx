import { notFound } from "next/navigation";
import { isLocale } from "../../../lib/locale";
import ResourcesPage, { createResourcesMetadata } from "../../resources/page";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? createResourcesMetadata({ routeLocale: locale, localized: true }) : { alternates: { canonical: null } };
}

export default async function LocalizedResourcesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ResourcesPage routeLocale={locale} localized />;
}
