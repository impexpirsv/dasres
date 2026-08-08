import { notFound } from "next/navigation";

import { helpCategories } from "../../../../lib/content";
import { isLocale } from "../../../../lib/locale";
import HelpCategoryPage, {
  createHelpCategoryMetadata,
} from "../../../help/[category]/page";

type Props = { params: Promise<{ locale: string; category: string }> };

export function generateStaticParams() {
  return helpCategories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, category } = await params;
  if (!isLocale(locale)) notFound();
  return createHelpCategoryMetadata({
    params: Promise.resolve({ category }),
    routeLocale: locale,
    localized: true,
  });
}

export default async function LocalizedHelpCategoryPage({ params }: Props) {
  const { locale, category } = await params;
  if (!isLocale(locale)) notFound();
  return HelpCategoryPage({
    params: Promise.resolve({ category }),
    routeLocale: locale,
    localized: true,
  });
}
