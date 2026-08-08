import { notFound } from "next/navigation";
import { isLocale } from "../../../lib/locale";
import TermsPage, { createTermsMetadata } from "../../terms/page";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return createTermsMetadata({ routeLocale: locale, localized: true }); }
export default async function LocalizedTermsPage({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return TermsPage({ routeLocale: locale, localized: true }); }
