import { notFound } from "next/navigation";
import { isLocale } from "../../../../../lib/locale";
import KnowledgeArticlePage, { createResourcesArticleMetadata } from "../../../../resources/[category]/[slug]/page";

type Props = { params: Promise<{ locale: string; category: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const values = await params;
  return isLocale(values.locale) ? createResourcesArticleMetadata({ params: Promise.resolve({ category: values.category, slug: values.slug }), routeLocale: values.locale, localized: true }) : { alternates: { canonical: null } };
}

export default async function LocalizedResourcesArticlePage({ params }: Props) {
  const values = await params;
  if (!isLocale(values.locale)) notFound();
  return <KnowledgeArticlePage params={Promise.resolve({ category: values.category, slug: values.slug })} routeLocale={values.locale} localized />;
}
