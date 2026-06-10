import DashboardSidebar from "../components/DashboardSidebar";
import { requireUser } from "../../lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <DashboardSidebar
        isAdmin={user.role === "admin"}
      />

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}