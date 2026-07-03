import Link from "next/link";

type Props = {
  unreadNotificationsCount: number;
  openTicketsCount: number;
  openCasesCount: number;
  myProposalsCount: number;
};

export default function DashboardAttention({
  unreadNotificationsCount,
  openTicketsCount,
  openCasesCount,
  myProposalsCount,
}: Props) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Needs Your Attention</h2>
        <p className="text-slate-400 text-sm">Important items to review</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Link href="/dashboard/notifications" className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-blue-500 transition-all">
          <p className="text-slate-500 text-sm">Unread Notifications</p>
          <p className="text-4xl font-bold text-blue-400 mt-3">{unreadNotificationsCount}</p>
        </Link>

        <Link href="/dashboard/tickets" className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-purple-500 transition-all">
          <p className="text-slate-500 text-sm">Open Tickets</p>
          <p className="text-4xl font-bold text-purple-400 mt-3">{openTicketsCount}</p>
        </Link>

        <Link href="/dashboard/open-cases" className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-500 transition-all">
          <p className="text-slate-500 text-sm">Open Cases</p>
          <p className="text-4xl font-bold text-emerald-400 mt-3">{openCasesCount}</p>
        </Link>

        <Link href="/dashboard/my-proposals" className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-yellow-500 transition-all">
          <p className="text-slate-500 text-sm">My Proposals</p>
          <p className="text-4xl font-bold text-yellow-400 mt-3">{myProposalsCount}</p>
        </Link>
      </div>
    </section>
  );
}