import { getTranslations } from "next-intl/server";

type DashboardProfileCardProps = {
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export default async function DashboardProfileCard({
  user,
}: DashboardProfileCardProps) {
  const t = await getTranslations("dashboardProfileCard");

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8">
      <h2 className="text-2xl font-bold mb-4">
        {t("title")}
      </h2>

      <div className="space-y-2">
        <p>
          <strong>{t("name")}:</strong> {user.name}
        </p>

        <p>
          <strong>{t("email")}:</strong> {user.email}
        </p>

        <p>
          <strong>{t("role")}:</strong>{" "}
          {user.role === "admin"
            ? t("roles.admin")
            : t("roles.user")}
        </p>
      </div>
    </div>
  );
}