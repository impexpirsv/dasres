"use client";

import { translations } from "../translations";

export function getLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  return (
    localStorage.getItem("dasres_lang") || "en"
  );
}

export function getTranslation() {
  const lang = getLanguage();

  return translations[
    lang as keyof typeof translations
  ];
}