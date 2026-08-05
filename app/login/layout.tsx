import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createPublicPageMetadata } from "../../lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("loginPage");

  return createPublicPageMetadata({
    title: t("title"),
    description: t("description"),
    canonical: "/login",
    robots: {
      index: false,
      follow: true,
    },
  });
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
