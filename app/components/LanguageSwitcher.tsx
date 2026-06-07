"use client";

import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const saved =
      localStorage.getItem("dasres_lang") || "en";

    setLanguage(saved);
  }, []);

  function changeLanguage(lang: string) {
    localStorage.setItem("dasres_lang", lang);
    setLanguage(lang);

    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => changeLanguage("en")}
        className={
          language === "en"
            ? "text-blue-400"
            : "text-slate-400"
        }
      >
        EN
      </button>

      <span>|</span>

      <button
        onClick={() => changeLanguage("fa")}
        className={
          language === "fa"
            ? "text-blue-400"
            : "text-slate-400"
        }
      >
        FA
      </button>
    </div>
  );
}