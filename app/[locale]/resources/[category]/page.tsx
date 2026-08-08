import { notFound } from "next/navigation";
import { isLocale } from "../../../../lib/locale";
import KnowledgeCategoryPage, { createResourcesCategoryMetadata } from "../../../resources/[category]/page";

type Props = { params: Promise<{ locale: string; category: string }> };

export async function generateMetadata({ params }: Props) {
  const values = await params;
  return isLocale(values.locale) ? createResourcesCategoryMetadata({ params: Promise.resolve({ category: values.category }), routeLocale: values.locale, localized: true }) : { alternates: { canonical: null } };
}

export default async function LocalizedResourcesCategoryPage({ params }: Props) {
  const values = await params;
  if (!isLocale(values.locale)) notFound();
  return <KnowledgeCategoryPage params={Promise.resolve({ category: values.category })} routeLocale={values.locale} localized />;
}
