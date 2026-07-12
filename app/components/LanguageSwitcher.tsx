"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { languageOptions, type Locale } from "../../lib/locale";

const COOKIE_NAME = "NEXT_LOCALE";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function changeLanguage(value: Locale) {
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=31536000; samesite=lax`;

    router.refresh();
  }

  return (
    <select
      value={locale}
      onChange={(e) =>
        changeLanguage(e.target.value as Locale)
      }
      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
    >
      {languageOptions.map((language) => (
        <option
          key={language.code}
          value={language.code}
        >
          {language.flag} {language.nativeName}
        </option>
      ))}
    </select>
  );
}