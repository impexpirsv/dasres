import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createPublicPageMetadata } from "../../lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forgotPasswordPage");
  return createPublicPageMetadata({ title: t("title"), description: t("description"), canonical: "/forgot-password", robots: { index: false, follow: true } });
}

export default function ForgotPasswordLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
