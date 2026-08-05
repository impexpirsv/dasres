import type { Locale } from "../locale";
import { getAbsoluteUrl, getPublicAbsoluteUrl } from "./urls";

const openGraphLocaleMap: Record<Locale, string> = {
  fa: "fa_IR",
  en: "en_US",
  ar: "ar_SA",
  fr: "fr_FR",
  es: "es_ES",
  zh: "zh_CN",
  ja: "ja_JP",
  de: "de_DE",
  ru: "ru_RU",
  tr: "tr_TR",
  pt: "pt_PT",
  it: "it_IT",
};

function getImageMimeType(url: string): string | undefined {
  const pathname = new URL(url).pathname.toLowerCase();

  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (pathname.endsWith(".png")) {
    return "image/png";
  }

  if (pathname.endsWith(".webp")) {
    return "image/webp";
  }

  return undefined;
}

export function getOpenGraphLocale(locale: string): string {
  return (
    openGraphLocaleMap[locale as Locale] ??
    openGraphLocaleMap.fa
  );
}

export function getEntitySocialImage(
  value: string | null | undefined,
  alt: string,
) {
  const url = getPublicAbsoluteUrl(value);

  if (!url) {
    return null;
  }

  const type = getImageMimeType(url);

  return {
    url,
    alt,
    ...(type ? { type } : {}),
  };
}

export function getDefaultSocialImage(alt: string) {
  return {
    url: getAbsoluteUrl("/og-image.png"),
    width: 1200,
    height: 630,
    type: "image/png",
    alt,
  };
}
