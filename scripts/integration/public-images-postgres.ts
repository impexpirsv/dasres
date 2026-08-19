import "server-only";

import assert from "node:assert/strict";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { createCompany } from "../../lib/companies/create-company";
import { deleteCompany } from "../../lib/companies/delete-company";
import { updateCompany } from "../../lib/companies/update-company";
import { createExpert } from "../../lib/experts/create-expert";
import { deleteExpert } from "../../lib/experts/delete-expert";
import { updateExpert } from "../../lib/experts/update-expert";
import { createOpportunity } from "../../lib/opportunities/create-opportunity";
import { deleteOpportunity } from "../../lib/opportunities/delete-opportunity";
import { updateOpportunity } from "../../lib/opportunities/update-opportunity";
import { prisma } from "../../lib/prisma";
import { DeterministicStoredByteScanner } from "../../lib/storage/file-scan-workflow";
import { InMemorySecureObjectStorage } from "../../lib/storage/secure-object-storage";
import { migratePublicImageRecord, readLegacyPublicImage } from "../migrate-public-images";

class ObservedStorage extends InMemorySecureObjectStorage {
  puts = 0;
  removes: string[] = [];
  override async putImmutable(key: string, body: AsyncIterable<Uint8Array>): Promise<{ size: number }> {
    this.puts += 1;
    return super.putImmutable(key, body);
  }
  override async remove(key: string): Promise<void> {
    this.removes.push(key);
    await super.remove(key);
  }
}

class CountingScanner extends DeterministicStoredByteScanner {
  calls = 0;
  override async scanStream(body: AsyncIterable<Uint8Array>): Promise<"CLEAN"> {
    this.calls += 1;
    return super.scanStream(body) as Promise<"CLEAN">;
  }
}

async function imageFile(format: "jpeg" | "png" | "webp", color: string): Promise<File> {
  const bytes = await sharp({ create: { width: 4, height: 3, channels: 3, background: color } })[format]().toBuffer();
  return new File([new Uint8Array(bytes)], `image.${format === "jpeg" ? "jpg" : format}`, { type: `image/${format}` });
}

async function main(): Promise<void> {
  const database = new URL(process.env.TEST_DATABASE_URL ?? "");
  assert(["127.0.0.1", "localhost"].includes(database.hostname));
  assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);

  const suffix = crypto.randomUUID();
  const [owner, outsider, admin] = await Promise.all([
    prisma.user.create({ data: { name: "Image Owner", email: `owner-${suffix}@example.test`, password: "hash", emailVerifiedAt: new Date() } }),
    prisma.user.create({ data: { name: "Image Outsider", email: `outsider-${suffix}@example.test`, password: "hash", emailVerifiedAt: new Date() } }),
    prisma.user.create({ data: { name: "Image Admin", email: `admin-${suffix}@example.test`, password: "hash", role: "admin", emailVerifiedAt: new Date() } }),
  ]);
  const storage = new ObservedStorage();
  const scanner = new CountingScanner();
  const dependencies = { storage, scanner };

  const company = await createCompany({ authenticatedUserId: owner.id, imageDependencies: dependencies, input: {
    name: `Company ${suffix}`, country: "IR", category: "Tech", description: "Secure company", email: `company-${suffix}@example.test`, website: "https://example.test", logoFile: await imageFile("jpeg", "red"),
  } });
  const companyRow = await prisma.company.findUniqueOrThrow({ where: { id: company.id } });
  assert(companyRow.logoStorageKey?.startsWith("quarantine/company-logo/"));
  assert.equal(companyRow.logoStorageProvider, "r2"); assert.equal(companyRow.logoMimeType, "image/jpeg");
  assert(companyRow.logoFileSize && companyRow.logoFileSize > 0); assert.match(companyRow.logoChecksumSha256 ?? "", /^[0-9a-f]{64}$/);
  assert.equal(companyRow.logoScanStatus, "CLEAN"); assert(companyRow.logoScannedAt); assert.equal(companyRow.logoScanEngine, "clamav"); assert(companyRow.logoScanAttempts > 0);

  const beforeDeniedPuts = storage.puts; const beforeDeniedScans = scanner.calls;
  const deniedCompanyImage = await imageFile("png", "blue");
  await assert.rejects(() => updateCompany({ companyId: company.id, authenticatedUserId: outsider.id, imageDependencies: dependencies, input: {
    name: company.name, country: company.country, category: company.category, description: company.description, email: company.email, website: company.website, logoFile: deniedCompanyImage,
  } }));
  assert.equal(storage.puts, beforeDeniedPuts); assert.equal(scanner.calls, beforeDeniedScans);

  const oldCompanyKey = companyRow.logoStorageKey!;
  await updateCompany({ companyId: company.id, authenticatedUserId: owner.id, imageDependencies: dependencies, input: {
    name: company.name, country: company.country, category: company.category, description: company.description, email: company.email, website: company.website, logoFile: await imageFile("png", "blue"),
  } });
  const replacedCompany = await prisma.company.findUniqueOrThrow({ where: { id: company.id } });
  assert.notEqual(replacedCompany.logoStorageKey, oldCompanyKey); assert(storage.removes.includes(oldCompanyKey));

  const expert = await createExpert({ authenticatedUserId: owner.id, imageDependencies: dependencies, input: {
    name: `Expert ${suffix}`, country: "IR", specialty: "Security", experience: "Ten years", email: `expert-${suffix}@example.test`, imageFile: await imageFile("webp", "green"),
  } });
  const expertRow = await prisma.expert.findUniqueOrThrow({ where: { id: expert.id } });
  assert.equal(expertRow.imageScanStatus, "CLEAN"); assert.equal(expertRow.imageMimeType, "image/webp"); assert(expertRow.imageScanAttempts > 0);
  const expertPuts = storage.puts; const expertScans = scanner.calls;
  const deniedExpertImage = await imageFile("jpeg", "black");
  await assert.rejects(() => updateExpert({ expertId: expert.id, authenticatedUserId: outsider.id, imageDependencies: dependencies, input: {
    name: expert.name, country: expert.country, specialty: expert.specialty, experience: expert.experience, email: expert.email, imageFile: deniedExpertImage,
  } }));
  assert.equal(storage.puts, expertPuts); assert.equal(scanner.calls, expertScans);

  const opportunity = await createOpportunity({ authenticatedAdminId: admin.id, imageDependencies: dependencies, input: {
    title: `Opportunity ${suffix}`, country: "IR", description: "Secure opportunity", imageFile: await imageFile("png", "yellow"),
  } });
  const opportunityRow = await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunity.id } });
  assert.equal(opportunityRow.imageScanStatus, "CLEAN"); assert.equal(opportunityRow.imageMimeType, "image/png"); assert(opportunityRow.imageScanAttempts > 0);
  const opportunityPuts = storage.puts; const opportunityScans = scanner.calls;
  const deniedOpportunityImage = await imageFile("jpeg", "white");
  await assert.rejects(() => updateOpportunity({ opportunityId: opportunity.id, authenticatedAdminId: outsider.id, imageDependencies: dependencies, input: {
    title: opportunity.title, country: opportunity.country, description: opportunity.description, imageFile: deniedOpportunityImage,
  } }));
  assert.equal(storage.puts, opportunityPuts); assert.equal(scanner.calls, opportunityScans);

  const companyDeleteKey = replacedCompany.logoStorageKey!;
  await deleteCompany({ companyId: company.id, authenticatedUserId: owner.id, imageStorage: storage });
  assert(storage.removes.includes(companyDeleteKey));
  await assert.rejects(() => deleteCompany({ companyId: company.id, authenticatedUserId: owner.id, imageStorage: storage }));
  await deleteExpert({ expertId: expert.id, authenticatedUserId: owner.id, imageStorage: storage });
  await deleteOpportunity({ opportunityId: opportunity.id, authenticatedAdminId: admin.id, imageStorage: storage });

  const failureOwner = await prisma.user.create({ data: { name: "Finalize Failure", email: `failure-${suffix}@example.test`, password: "hash", emailVerifiedAt: new Date() } });
  const failureCompany = await createCompany({ authenticatedUserId: failureOwner.id, input: {
    name: `Failure Company ${suffix}`, country: "IR", category: "Tech", description: "Old authoritative state", email: `failure-company-${suffix}@example.test`, website: "https://example.test", logoFile: null,
  } });
  const finalizationStorage = new ObservedStorage();
  const destructiveScanner = {
    async scanStream(body: AsyncIterable<Uint8Array>): Promise<"CLEAN"> {
      for await (const _chunk of body) void _chunk;
      await prisma.user.delete({ where: { id: failureOwner.id } });
      return "CLEAN";
    },
  };
  const finalizationImage = await imageFile("png", "orange");
  await assert.rejects(() => updateCompany({ companyId: failureCompany.id, authenticatedUserId: failureOwner.id,
    imageDependencies: { storage: finalizationStorage, scanner: destructiveScanner }, input: {
      name: failureCompany.name, country: failureCompany.country, category: failureCompany.category, description: failureCompany.description,
      email: failureCompany.email, website: failureCompany.website, logoFile: finalizationImage,
    },
  }));
  const preservedFailureCompany = await prisma.company.findUniqueOrThrow({ where: { id: failureCompany.id } });
  assert.equal(preservedFailureCompany.logoStorageKey, null); assert.equal(preservedFailureCompany.description, "Old authoritative state");
  assert.equal(finalizationStorage.removes.length, 1, "new object cleanup must be attempted after DB finalization failure");

  const legacyName = `batch-c-integration-${suffix}.png`;
  const legacyDirectory = path.join(process.cwd(), "public", "uploads", "companies");
  const legacyPath = path.join(legacyDirectory, legacyName);
  await mkdir(legacyDirectory, { recursive: true });
  await writeFile(legacyPath, await sharp({ create: { width: 3, height: 3, channels: 3, background: "purple" } }).png().toBuffer(), { flag: "wx" });
  try {
    const legacy = await prisma.company.create({ data: {
      name: `Legacy ${suffix}`, country: "IR", category: "Tech", status: "Active", description: "Legacy", email: `legacy-${suffix}@example.test`, website: "https://example.test", logoUrl: `/uploads/companies/${legacyName}`, ownerId: owner.id,
    } });
    const sourceBefore = await readFile(legacyPath);
    await migratePublicImageRecord("company", legacy.id, legacy.logoUrl!, false, dependencies);
    assert.equal((await prisma.company.findUniqueOrThrow({ where: { id: legacy.id } })).logoStorageKey, null);
    assert.deepEqual(await readFile(legacyPath), sourceBefore);
    await assert.rejects(() => readLegacyPublicImage("company", "/uploads/companies/../outside.png"));
    await assert.rejects(() => readLegacyPublicImage("company", "C:\\outside.png"));
    await migratePublicImageRecord("company", legacy.id, legacy.logoUrl!, true, dependencies);
    const migrated = await prisma.company.findUniqueOrThrow({ where: { id: legacy.id } });
    assert.equal(migrated.logoScanStatus, "CLEAN"); assert(migrated.logoStorageKey);
    assert.deepEqual(await readFile(legacyPath), sourceBefore);
    const removalsBeforeConflict = storage.removes.length;
    await assert.rejects(() => migratePublicImageRecord("company", legacy.id, legacy.logoUrl!, true, dependencies));
    assert.equal((await prisma.company.findUniqueOrThrow({ where: { id: legacy.id } })).logoStorageKey, migrated.logoStorageKey);
    assert.equal(storage.removes.length, removalsBeforeConflict + 1, "conditional conflict must clean the newly uploaded object");
  } finally {
    await unlink(legacyPath).catch(() => undefined);
  }

  console.log("PUBLIC IMAGE POSTGRES RESULT: all three domains finalized complete CLEAN metadata; authorization preceded storage/scanning; replacement, deletion, and dry-run/apply legacy backfill passed");
  await prisma.$disconnect();
}

main().catch(async (error: unknown) => { await prisma.$disconnect(); throw error; });
