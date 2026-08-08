import { notFound } from "next/navigation";

import { isLocale } from "../../../lib/locale";
import ExpertsPage, { createExpertsMetadata } from "../../experts/page";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return createExpertsMetadata({ searchParams, routeLocale: locale, localized: true });
}

export default async function LocalizedExpertsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return ExpertsPage({ searchParams, routeLocale: locale, localized: true });
}
