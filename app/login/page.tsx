"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
const t = useTranslations("loginPage");
  const recovery = useTranslations("forgotPasswordPage");
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "/dashboard";
      } else {
        setMessage(data.message || t("loginFailed"));
      }
    } catch {
      setMessage(t("loginFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="ui-card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {t("title")}
        </h1>

        <p className="text-slate-400 mb-8">
          {t("description")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="login-email" className="block text-sm font-semibold text-slate-300">{t("email")}</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
           placeholder={t("email")}
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="ui-field"
          />

          <label htmlFor="login-password" className="block text-sm font-semibold text-slate-300">{t("password")}</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
           placeholder={t("password")}
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="ui-field"
          />

          <div className="text-end">
            <Link href="/forgot-password" className="text-sm font-medium text-blue-400 hover:underline">
              {recovery("link")}
            </Link>
          </div>

          <button disabled={isSubmitting} aria-busy={isSubmitting} className="ui-button ui-button-primary w-full">
            {t("login")}
          </button>
        </form>

        {message && (
          <p role="alert" className="mt-6 text-red-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
