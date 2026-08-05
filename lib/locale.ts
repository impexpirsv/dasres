export const locales = [
  "fa",
  "en",
  "ar",
  "fr",
  "es",
  "zh",
  "ja",
  "de",
  "ru",
  "tr",
  "pt",
  "it",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fa";

export const rtlLocales: Locale[] = ["fa", "ar"];

export const languageOptions: {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}[] = [
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocale(
  requestLocale: string | undefined,
  cookieLocale: string | undefined,
): Locale {
  if (requestLocale && isLocale(requestLocale)) {
    return requestLocale;
  }

  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

export function getLocalizedHomepageLocale(
  pathname: string,
): Locale | null {
  const candidate = pathname.match(/^\/([^/]+)\/?$/)?.[1];

  return candidate && isLocale(candidate) ? candidate : null;
}

export function getLocalizedPublicPathLocale(pathname: string): Locale | null {
  const segments = pathname.split("/");
  const candidate = segments[1];

  if (!candidate || !isLocale(candidate)) {
    return null;
  }

  return segments.length === 2 ||
    (segments.length === 3 && segments[2] === "") ||
    segments[2] === "companies"
    ? candidate
    : null;
}

export function isRtl(locale: Locale) {
  return rtlLocales.includes(locale);
}


export const dateLocaleMap: Record<Locale, string> = {
  fa: "fa-IR",
  en: "en-US",
  ar: "ar",
  fr: "fr-FR",
  es: "es-ES",
  zh: "zh-CN",
  ja: "ja-JP",
  de: "de-DE",
  ru: "ru-RU",
  tr: "tr-TR",
  pt: "pt-PT",
  it: "it-IT",
};


export function getDateLocale(locale: Locale) {
  return dateLocaleMap[locale] ?? "en-US";
}
