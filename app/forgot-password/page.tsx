"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPasswordPage");
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) setAccepted(true);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="ui-card w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-2 text-3xl font-bold text-white">{t("title")}</h1>
        <p className="mb-8 text-slate-400">{accepted ? t("accepted") : t("description")}</p>
        {!accepted && (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="recovery-email" className="mb-2 block text-sm font-medium text-slate-300">{t("emailLabel")}</label>
              <input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="ui-field" />
            </div>
            <button type="submit" disabled={pending} aria-busy={pending} className="ui-button ui-button-primary w-full">{pending ? t("submitting") : t("submit")}</button>
          </form>
        )}
        {error && <p role="alert" className="mt-6 text-red-300">{t("error")}</p>}
        <p className="mt-8 text-center text-sm"><Link href="/login" className="font-medium text-blue-400 hover:underline">{t("backToLogin")}</Link></p>
      </div>
    </main>
  );
}
