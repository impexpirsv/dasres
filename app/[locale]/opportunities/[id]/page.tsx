import { notFound } from "next/navigation";

import { isLocale } from "../../../../lib/locale";
import OpportunityProfilePage, {
  createOpportunityMetadata,
} from "../../../opportunities/[id]/page";

type Props = { params: Promise<{ locale: string; id: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  return createOpportunityMetadata({
    params: Promise.resolve({ id }),
    routeLocale: locale,
    localized: true,
  });
}

export default async function LocalizedOpportunityProfilePage({
  params,
}: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  return OpportunityProfilePage({
    params: Promise.resolve({ id }),
    routeLocale: locale,
    localized: true,
  });
}
