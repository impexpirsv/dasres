import { notFound } from "next/navigation";

import { isLocale } from "../../../../lib/locale";
import CompanyProfilePage, {
  createCompanyMetadata,
} from "../../../companies/[id]/page";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  return createCompanyMetadata({
    params: Promise.resolve({ id }),
    routeLocale: locale,
    localized: true,
  });
}

export default async function LocalizedCompanyProfilePage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  return CompanyProfilePage({
    params: Promise.resolve({ id }),
    routeLocale: locale,
    localized: true,
  });
}
