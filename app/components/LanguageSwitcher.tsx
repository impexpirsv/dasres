"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  getLocalizedPublicPathLocale,
  isLocale,
  languageOptions,
} from "../../lib/locale";

const COOKIE_NAME = "NEXT_LOCALE";

export default function LanguageSwitcher({
  ariaLabel,
  onLocaleChange,
}: {
  ariaLabel: string;
  onLocaleChange?: () => void;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function changeLanguage(value: string) {
    if (!isLocale(value)) {
      return;
    }
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=31536000; samesite=lax`;

    onLocaleChange?.();

    const localizedPathLocale = getLocalizedPublicPathLocale(pathname);

    if (localizedPathLocale) {
      const localizedPath = pathname.replace(
        `/${localizedPathLocale}`,
        `/${value}`,
      );
      window.location.assign(
        `${localizedPath}${window.location.search}${window.location.hash}`,
      );
      return;
    }

    router.refresh();
  }

  return (
    <select
      aria-label={ariaLabel}
      value={locale}
      onChange={(e) =>
        changeLanguage(e.target.value)
      }
      className="ui-field w-auto max-w-full py-2 text-sm"
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
