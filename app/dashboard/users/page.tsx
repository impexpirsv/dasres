import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";
import MakeAdminButton from "../../components/MakeAdminButton";
import DeleteUserButton from "../../components/DeleteUserButton";

export default async function UsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: {
      id: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          Users Management
        </h1>

        <div className="bg-slate-900 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-800"
                >
                  <td className="p-4">{user.id}</td>
                  <td className="p-4">{user.name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{user.role}</td>

                  <td className="p-4">
                    <div className="flex gap-3">
                      {user.role !== "admin" && (
                        <>
                          <MakeAdminButton id={user.id} />
                          <DeleteUserButton id={user.id} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}