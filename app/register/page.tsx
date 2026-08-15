"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("registerPage");
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || t("registrationFailed"));
        return;
      }

      router.push("/verify-email?status=pending");
    } catch {
      setMessage(t("registrationFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-12">
      <div className="ui-card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {t("title")}
        </h1>

        <p className="text-slate-400 mb-8">
          {t("description")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              {t("name.label")}
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t("name.placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="ui-field"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              {t("email.label")}
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("email.placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="ui-field"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              {t("password.label")}
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={t("password.placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="ui-field"
            />

            <p className="text-xs text-slate-500 mt-2">
              {t("password.hint")}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="ui-button ui-button-primary w-full"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
        </form>

        {message && (
          <p
            role="alert"
            className="text-red-400 mt-6"
          >
            {message}
          </p>
        )}

        <p className="text-sm text-slate-400 mt-8 text-center">
          {t("alreadyHaveAccount")}{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:underline font-medium"
          >
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
