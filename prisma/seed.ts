
import { PrismaClient, CaseStatus, ProposalStatus, ProjectStatus, TaskStatus, TaskPriority, PlanType, VerificationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function assertDisposableSeedTarget(environment: Readonly<Record<string, string | undefined>>): void {
  if (environment.NODE_ENV === "production") throw new Error("Production seeding is forbidden.");
  if (environment.SEED_ALLOW_DISPOSABLE_LOOPBACK !== "1") throw new Error("Set SEED_ALLOW_DISPOSABLE_LOOPBACK=1 for an acknowledged disposable database.");
  const value = environment.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required.");
  const database = new URL(value);
  if (database.protocol !== "postgresql:" || !["127.0.0.1", "localhost", "::1"].includes(database.hostname.toLowerCase())) {
    throw new Error("Seed is restricted to disposable loopback PostgreSQL.");
  }
}

const prisma = new PrismaClient();

async function main() {
  assertDisposableSeedTarget(process.env);
  const password = await bcrypt.hash("Test12345!", 10);

  await prisma.user.upsert({
    where: { email: "admin@dasres.test" },
    update: {},
    create: { name: "Admin", email: "admin@dasres.test", password, role: "ADMIN", planType: PlanType.ENTERPRISE },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@dasres.test" },
    update: {},
    create: { name: "Normal User", email: "user@dasres.test", password, role: "USER" },
  });

  const companyUser = await prisma.user.upsert({
    where: { email: "company@dasres.test" },
    update: {},
    create: { name: "Company User", email: "company@dasres.test", password, role: "USER", planType: PlanType.GOLD },
  });

  const businessUser = await prisma.user.upsert({
    where: { email: "business@dasres.test" },
    update: {},
    create: { name: "Business User", email: "business@dasres.test", password, role: "USER", planType: PlanType.DIAMOND },
  });

  const company = await prisma.company.create({
    data: {
      name: "Global Trade Co",
      country: "Germany",
      category: "SOURCING",
      status: "ACTIVE",
      description: "International trading company",
      email: "contact@globaltrade.test",
      website: "https://globaltrade.test",
      ownerId: companyUser.id,
      planType: PlanType.GOLD,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  const expert = await prisma.expert.create({
    data: {
      name: "Customs Expert",
      country: "UAE",
      specialty: "CUSTOMS_CLEARANCE",
      status: "ACTIVE",
      experience: "10 years",
      email: "expert@dasres.test",
      ownerId: businessUser.id,
      planType: PlanType.DIAMOND,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  const tradeCase = await prisma.tradeCase.create({
    data: {
      title: "Import Machinery",
      description: "Import project test case",
      category: "SHIPPING",
      status: CaseStatus.IN_PROGRESS,
      customerId: user.id,
    },
  });

  await prisma.caseProposal.create({
    data: {
      caseId: tradeCase.id,
      companyId: company.id,
      expertId: expert.id,
      message: "We can handle this case",
      price: "10000",
      status: ProposalStatus.ACCEPTED,
    },
  });

  const project = await prisma.project.create({
    data: {
      tradeCaseId: tradeCase.id,
      title: "Machinery Import Project",
      description: "Seed project",
      createdBy: businessUser.id,
      assignedTo: businessUser.id,
      status: ProjectStatus.ACTIVE,
      progress: 40,
    },
  });

  const task = await prisma.projectTask.create({
    data: {
      projectId: project.id,
      title: "Prepare documents",
      description: "Prepare customs documents",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assignedToId: businessUser.id,
      estimatedHours: 10,
      loggedHours: 3,
      remainingHours: 7,
      progress: 40,
    },
  });

  await prisma.projectTaskChecklist.create({
    data: {
      taskId: task.id,
      title: "Check documents",
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "New Project",
      message: "A project has been created",
      type: "PROJECT",
    },
  });

  await prisma.ticket.create({
    data: {
      userId: user.id,
      subject: "Support test ticket",
      status: "OPEN",
      category: "GENERAL",
    },
  });

  console.log("Dasres full seed completed");
}

const entrypoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (entrypoint === import.meta.url) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : "Seed failed");
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
