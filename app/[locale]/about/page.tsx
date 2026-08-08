import { notFound } from "next/navigation";
import { isLocale } from "../../../lib/locale";
import AboutPage, { createAboutMetadata } from "../../about/page";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return createAboutMetadata({ routeLocale: locale, localized: true }); }
export default async function LocalizedAboutPage({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return AboutPage({ routeLocale: locale, localized: true }); }
