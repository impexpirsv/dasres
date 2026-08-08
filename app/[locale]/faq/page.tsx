import { notFound } from "next/navigation";
import { isLocale } from "../../../lib/locale";
import FaqPage, { createFaqMetadata } from "../../faq/page";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return createFaqMetadata({ routeLocale: locale, localized: true }); }
export default async function LocalizedFaqPage({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return FaqPage({ routeLocale: locale, localized: true }); }
