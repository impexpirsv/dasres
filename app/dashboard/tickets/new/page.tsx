import { getTranslations } from "next-intl/server";
import { requireUser } from "../../../../lib/auth";
import NewTicketForm from "../../../components/NewTicketForm";

export default async function NewTicketPage() {
  await requireUser();

  const t = await getTranslations("tickets.new");

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="mb-4 text-4xl font-bold">
        {t("title")}
      </h1>

      <p className="mb-8 text-slate-400">
        {t("description")}
      </p>

      <NewTicketForm />
    </div>
  );
}