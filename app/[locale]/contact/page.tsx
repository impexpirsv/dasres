import { notFound } from "next/navigation";
import { isLocale } from "../../../lib/locale";
import ContactPage, { createContactMetadata } from "../../contact/page";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return createContactMetadata({ routeLocale: locale, localized: true }); }
export default async function LocalizedContactPage({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return ContactPage({ routeLocale: locale, localized: true }); }
