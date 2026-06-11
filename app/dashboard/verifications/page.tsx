import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";
import VerificationCompanyActions from "../../components/VerificationCompanyActions";
import Link from "next/link";
export default async function VerificationsPage() {
    await requireAdmin();

    const pendingCompanies =
        await prisma.company.findMany({
            where: {
                verificationStatus: "PENDING",
            },
            orderBy: {
                id: "desc",
            },
        });

    const verifiedCount =
        await prisma.company.count({
            where: {
                verificationStatus: "VERIFIED",
            },
        });

    const rejectedCount =
        await prisma.company.count({
            where: {
                verificationStatus: "REJECTED",
            },
        });

    return (
        <div className="max-w-7xl mx-auto px-6 py-20">
            <h1 className="text-4xl font-bold mb-10">
                Verification Dashboard
            </h1>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="text-slate-400 text-sm">
                        Pending
                    </div>

                    <div className="text-4xl font-bold text-yellow-400 mt-2">
                        {pendingCompanies.length}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="text-slate-400 text-sm">
                        Verified
                    </div>

                    <div className="text-4xl font-bold text-green-400 mt-2">
                        {verifiedCount}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="text-slate-400 text-sm">
                        Rejected
                    </div>

                    <div className="text-4xl font-bold text-red-400 mt-2">
                        {rejectedCount}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-2xl font-bold">
                        Pending Companies
                    </h2>
                </div>

                {pendingCompanies.length === 0 ? (
                    <div className="p-6 text-slate-400">
                        No pending companies.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {pendingCompanies.map((company) => (
                            <div
                                key={company.id}
                                className="p-6 flex items-center justify-between"
                            >
                                <div>
                                    <Link
                                        href={`/companies/${company.id}`}
                                        className="font-bold hover:text-blue-400"
                                    >
                                        {company.name}
                                    </Link>

                                    <p className="text-sm text-slate-400 mt-1">
                                        {company.country} • {company.category}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-1">
                                        Created: {company.createdAt.toLocaleDateString()}
                                    </p>
                                </div>

                                <VerificationCompanyActions
                                    companyId={company.id}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}