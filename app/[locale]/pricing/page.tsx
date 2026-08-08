import { notFound } from "next/navigation";
import { isLocale } from "../../../lib/locale";
import PricingPage, { createPricingMetadata } from "../../pricing/page";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return createPricingMetadata({ routeLocale: locale, localized: true }); }
export default async function LocalizedPricingPage({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return PricingPage({ routeLocale: locale, localized: true }); }
