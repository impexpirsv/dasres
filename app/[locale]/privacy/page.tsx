import { notFound } from "next/navigation";
import { isLocale } from "../../../lib/locale";
import PrivacyPage, { createPrivacyMetadata } from "../../privacy/page";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return createPrivacyMetadata({ routeLocale: locale, localized: true }); }
export default async function LocalizedPrivacyPage({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return PrivacyPage({ routeLocale: locale, localized: true }); }
