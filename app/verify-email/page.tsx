"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";

type VerificationStatus = "pending" | "success" | "invalid" | "already-verified";

function VerifyEmailContent() {
  const t = useTranslations("verifyEmailPage");
  const searchParams = useSearchParams();
  const candidate = searchParams.get("status");
  const status: VerificationStatus = candidate === "success" || candidate === "invalid" || candidate === "already-verified" ? candidate : "pending";
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function resend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      const response = await fetch("/api/auth/resend-verification", {
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

  const stateMessage = status === "success"
    ? t("success")
    : status === "invalid"
      ? t("invalidOrExpired")
      : status === "already-verified"
        ? t("alreadyVerified")
        : t("description");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="ui-card w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-2 text-3xl font-bold text-white">{t("title")}</h1>
        <p role={status === "invalid" ? "alert" : "status"} className="mb-8 text-slate-300">{stateMessage}</p>
        {status === "success" || status === "already-verified" ? (
          <Link href="/login" className="ui-button ui-button-primary w-full">{t("continueToLogin")}</Link>
        ) : (
          <section aria-labelledby="resend-title">
            <h2 id="resend-title" className="mb-2 text-xl font-semibold text-white">{t("resendTitle")}</h2>
            <p className="mb-5 text-sm text-slate-400">{accepted ? t("resendAccepted") : t("resendDescription")}</p>
            {!accepted && (
              <form onSubmit={resend} className="space-y-5">
                <div>
                  <label htmlFor="verification-email" className="mb-2 block text-sm font-medium text-slate-300">{t("emailLabel")}</label>
                  <input id="verification-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="ui-field" />
                </div>
                <button type="submit" disabled={pending} aria-busy={pending} className="ui-button ui-button-primary w-full">{pending ? t("resending") : t("resend")}</button>
              </form>
            )}
            {error && <p role="alert" className="mt-6 text-red-300">{t("error")}</p>}
          </section>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  const t = useTranslations("verifyEmailPage");
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">{t("verifying")}</main>}><VerifyEmailContent /></Suspense>;
}
