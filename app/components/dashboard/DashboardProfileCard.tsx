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

  const t = await getTranslations(
    "dashboardProfileCard",
  );


  return (
    <div
      className="
        mb-8
        rounded-[2rem]
        border
        border-slate-800
        bg-gradient-to-br
        from-slate-900
        to-slate-950
        p-6
        shadow-xl
      "
    >

      <div className="mb-6 flex items-center justify-between">

        <h2 className="text-2xl font-black text-white">
          {t("title")}
        </h2>


        <div
          className="
            rounded-full
            border
            border-blue-500/30
            bg-blue-500/10
            px-3
            py-1
            text-xs
            font-semibold
            text-blue-300
          "
        >
          {user.role === "admin"
            ? t("roles.admin")
            : t("roles.user")}
        </div>

      </div>



      <div className="space-y-4">


        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/70
            p-4
          "
        >

          <p className="text-xs text-slate-500">
            {t("name")}
          </p>

          <p className="mt-1 font-semibold text-white">
            {user.name}
          </p>

        </div>



        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/70
            p-4
          "
        >

          <p className="text-xs text-slate-500">
            {t("email")}
          </p>

          <p className="mt-1 break-all font-medium text-slate-200">
            {user.email}
          </p>

        </div>


      </div>

    </div>
  );
}