"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

type State = "form" | "invalid" | "success";

export default function ResetPasswordPage() {
  const t = useTranslations("resetPasswordPage");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<State>("form");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (password !== confirmPassword) { setError(t("mismatch")); return; }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      if (response.ok) setState("success");
      else if (response.status === 400) setState("invalid");
      else setError(t("error"));
    } catch {
      setError(t("error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="ui-card w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-2 text-3xl font-bold text-white">{t("title")}</h1>
        {state === "success" ? <><p role="status" className="mb-8 text-slate-300">{t("success")}</p><Link href="/login" className="ui-button ui-button-primary w-full">{t("continueToLogin")}</Link></> : state === "invalid" ? <><p role="alert" className="mb-8 text-red-300">{t("invalid")}</p><Link href="/forgot-password" className="ui-button ui-button-primary w-full">{t("requestAnother")}</Link></> : <><p className="mb-8 text-slate-400">{t("description")}</p><form onSubmit={submit} className="space-y-5"><div><label htmlFor="new-password" className="mb-2 block text-sm font-medium text-slate-300">{t("passwordLabel")}</label><input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="ui-field" /><p className="mt-2 text-xs text-slate-500">{t("requirements")}</p></div><div><label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-slate-300">{t("confirmLabel")}</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="ui-field" /></div><button type="submit" disabled={pending} aria-busy={pending} className="ui-button ui-button-primary w-full">{pending ? t("submitting") : t("submit")}</button></form>{error && <p role="alert" className="mt-6 text-red-300">{error}</p>}</>}
      </div>
    </main>
  );
}
