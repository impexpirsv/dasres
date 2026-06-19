import { requireUser } from "../../../../lib/auth";
import NewTicketForm from "../../../components/NewTicketForm";

export default async function NewTicketPage() {
  await requireUser();

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-4">
        New Ticket
      </h1>

      <p className="text-slate-400 mb-8">
        Contact Dasres support about verification, billing,
        technical issues or general questions.
      </p>

      <NewTicketForm />
    </div>
  );
}