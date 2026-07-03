type DashboardProfileCardProps = {
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export default function DashboardProfileCard({
  user,
}: DashboardProfileCardProps) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>

      <p>
        <strong>Name:</strong> {user.name}
      </p>

      <p>
        <strong>Email:</strong> {user.email}
      </p>

      <p>
        <strong>Role:</strong> {user.role}
      </p>
    </div>
  );
}