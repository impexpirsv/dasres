import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createPublicPageMetadata } from "../../lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resetPasswordPage");
  return createPublicPageMetadata({ title: t("title"), description: t("description"), canonical: "/reset-password", robots: { index: false, follow: true } });
}

export default function ResetPasswordLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
