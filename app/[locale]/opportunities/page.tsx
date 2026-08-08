import { notFound } from "next/navigation";

import { isLocale } from "../../../lib/locale";
import OpportunitiesPage, {
  createOpportunitiesMetadata,
} from "../../opportunities/page";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return createOpportunitiesMetadata({
    searchParams,
    routeLocale: locale,
    localized: true,
  });
}

export default async function LocalizedOpportunitiesPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return OpportunitiesPage({
    searchParams,
    routeLocale: locale,
    localized: true,
  });
}
