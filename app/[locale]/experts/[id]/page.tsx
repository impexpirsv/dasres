import { notFound } from "next/navigation";

import { isLocale } from "../../../../lib/locale";
import ExpertProfilePage, { createExpertMetadata } from "../../../experts/[id]/page";

type Props = { params: Promise<{ locale: string; id: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  return createExpertMetadata({ params: Promise.resolve({ id }), routeLocale: locale, localized: true });
}

export default async function LocalizedExpertProfilePage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  return ExpertProfilePage({ params: Promise.resolve({ id }), routeLocale: locale, localized: true });
}
