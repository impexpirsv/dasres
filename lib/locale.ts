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

export function isRtl(locale: Locale) {
  return rtlLocales.includes(locale);
}