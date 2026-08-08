import { notFound } from "next/navigation";
import { isLocale } from "../../../lib/locale";
import CookiesPage, { createCookiesMetadata } from "../../cookies/page";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return createCookiesMetadata({ routeLocale: locale, localized: true }); }
export default async function LocalizedCookiesPage({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return CookiesPage({ routeLocale: locale, localized: true }); }
