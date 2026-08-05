import { notFound } from "next/navigation";

import { isLocale } from "../../../lib/locale";
import CompaniesPage, {
  createCompaniesMetadata,
} from "../../companies/page";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return createCompaniesMetadata({
    searchParams,
    routeLocale: locale,
    localized: true,
  });
}

export default async function LocalizedCompaniesPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return CompaniesPage({
    searchParams,
    routeLocale: locale,
    localized: true,
  });
}
