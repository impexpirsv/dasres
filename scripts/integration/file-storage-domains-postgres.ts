import assert from "node:assert/strict";
import { prisma } from "../../lib/prisma";
import { uploadCaseDocument, downloadCaseDocument, deleteCaseDocument } from "../../lib/cases";
import { uploadProjectTaskAttachment, downloadProjectTaskAttachment, deleteProjectTaskAttachment } from "../../lib/project-task-attachments";
import { DeterministicStoredByteScanner, type StoredByteScanner } from "../../lib/storage/file-scan-workflow";
import { InMemorySecureObjectStorage, type SecureObjectStorage } from "../../lib/storage/secure-object-storage";
import { FileSecurityError } from "../../lib/security/file-security-errors";
import { mkdir, rmdir, symlink, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const PDF = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
function request(bytes = PDF, name = "evidence.pdf", mime = "application/pdf"): Request {
  const boundary = "storage-domain-boundary";
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${mime}\r\n\r\n`), bytes, Buffer.from(`\r\n--${boundary}--\r\n`)]);
  return new Request("http://localhost/upload", { method: "POST", headers: { "content-type": `multipart/form-data; boundary=${boundary}` }, body });
}
function chunkedOversizedRequest(): Request {
  const boundary = "storage-domain-boundary";
  const prefix = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="oversized.pdf"\r\nContent-Type: application/pdf\r\n\r\n`);
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(prefix);
      for (let index = 0; index < 12; index += 1) controller.enqueue(Buffer.alloc(1024 * 1024, 0x41));
      controller.enqueue(suffix); controller.close();
    },
  });
  return new Request("http://localhost/upload", { method: "POST", headers: { "content-type": `multipart/form-data; boundary=${boundary}` }, body: stream, duplex: "half" } as RequestInit);
}
async function denied(operation: () => Promise<unknown>): Promise<void> { await assert.rejects(operation); }
class CountingScanner implements StoredByteScanner {
  calls = 0;
  async scanStream(): Promise<"CLEAN"> { this.calls += 1; return "CLEAN"; }
}
class CountingStorage extends InMemorySecureObjectStorage {
  puts = 0;
  override async putImmutable(key: string, body: AsyncIterable<Uint8Array>, contentType?: string): Promise<{ size: number }> {
    void contentType; this.puts += 1; return super.putImmutable(key, body);
  }
}
class PutFailureStorage extends InMemorySecureObjectStorage {
  override async putImmutable(): Promise<{ size: number }> { throw new FileSecurityError("storage_failure"); }
}
class CorruptReadStorage extends InMemorySecureObjectStorage {
  constructor(private readonly corrupt: "size" | "hash") { super(); }
  override async get(key: string) { const value = await super.get(key); if (this.corrupt === "size") return { ...value, size: value.size + 1 };
    return { size: value.size, body: (async function* () { yield Buffer.alloc(value.size, 0x41); })() }; }
}
class FinalizationFailureStorage extends InMemorySecureObjectStorage {
  lastKey: string | null = null;
  constructor(private readonly afterPut: () => Promise<void>) { super(); }
  override async putImmutable(key: string, body: AsyncIterable<Uint8Array>) {
    const result = await super.putImmutable(key, body); this.lastKey = key; await this.afterPut(); return result;
  }
}
class ObservedDownloadStorage extends InMemorySecureObjectStorage {
  pulls = 0; cancelled = false;
  private async *streamBody() {
    try {
      this.pulls += 1; yield PDF.subarray(0, 8);
      this.pulls += 1; yield PDF.subarray(8);
    } finally { this.cancelled = true; }
  }
  override async get(key: string) {
    void key;
    return { size: PDF.length, body: this.streamBody() };
  }
}

async function main(): Promise<void> {
  assert.equal(new URL(process.env.DATABASE_URL ?? "").hostname, "127.0.0.1");
  assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
  const [customer, provider, outsider] = await Promise.all([
    prisma.user.create({ data: { name: "File Customer", email: "file-customer@example.test", password: "x", emailVerifiedAt: new Date() } }),
    prisma.user.create({ data: { name: "File Provider", email: "file-provider@example.test", password: "x", emailVerifiedAt: new Date() } }),
    prisma.user.create({ data: { name: "File Outsider", email: "file-outsider@example.test", password: "x", emailVerifiedAt: new Date() } }),
  ]);
  const company = await prisma.company.create({ data: { name: "File Provider Co", country: "Test", category: "Test", status: "Active", description: "Test", email: "provider-co@example.test", website: "", ownerId: provider.id } });
  async function makeCase(title: string) {
    const tradeCase = await prisma.tradeCase.create({ data: { title, description: "Test", customerId: customer.id, status: "IN_PROGRESS" } });
    const proposal = await prisma.caseProposal.create({ data: { caseId: tradeCase.id, companyId: company.id, message: "Accepted", status: "ACCEPTED" } });
    return prisma.tradeCase.update({ where: { id: tradeCase.id }, data: { acceptedProposalId: proposal.id } });
  }
  const caseOne = await makeCase("File Case One"); const caseTwo = await makeCase("File Case Two"); const caseFinalization = await makeCase("File Case Finalization");
  const projectOne = await prisma.project.create({ data: { tradeCaseId: caseOne.id, title: "File Project One", createdBy: customer.id, assignedTo: provider.id } });
  const projectTwo = await prisma.project.create({ data: { tradeCaseId: caseTwo.id, title: "File Project Two", createdBy: customer.id, assignedTo: provider.id } });
  const taskOne = await prisma.projectTask.create({ data: { projectId: projectOne.id, title: "File Task One" } });
  const taskTwo = await prisma.projectTask.create({ data: { projectId: projectTwo.id, title: "File Task Two" } });
  const taskFinalization = await prisma.projectTask.create({ data: { projectId: projectTwo.id, title: "File Task Finalization" } });
  const storage = new InMemorySecureObjectStorage(); const clean = new DeterministicStoredByteScanner(); const deps = { storage, scanner: clean };

  const [crossCustomerA, crossProviderA, crossCustomerB, crossProviderB] = await Promise.all([
    prisma.user.create({ data: { name: "Cross Customer A", email: "cross-customer-a@example.test", password: "x", emailVerifiedAt: new Date() } }),
    prisma.user.create({ data: { name: "Cross Provider A", email: "cross-provider-a@example.test", password: "x", emailVerifiedAt: new Date() } }),
    prisma.user.create({ data: { name: "Cross Customer B", email: "cross-customer-b@example.test", password: "x", emailVerifiedAt: new Date() } }),
    prisma.user.create({ data: { name: "Cross Provider B", email: "cross-provider-b@example.test", password: "x", emailVerifiedAt: new Date() } }),
  ]);
  const [crossCompanyA, crossCompanyB] = await Promise.all([
    prisma.company.create({ data: { name: "Cross Company A", country: "Test", category: "Test", status: "Active", description: "Test", email: "cross-company-a@example.test", website: "", ownerId: crossProviderA.id } }),
    prisma.company.create({ data: { name: "Cross Company B", country: "Test", category: "Test", status: "Active", description: "Test", email: "cross-company-b@example.test", website: "", ownerId: crossProviderB.id } }),
  ]);
  async function makeCrossCase(title: string, customerId: number, companyId: number) {
    const tradeCase = await prisma.tradeCase.create({ data: { title, description: "Test", customerId, status: "IN_PROGRESS" } });
    const proposal = await prisma.caseProposal.create({ data: { caseId: tradeCase.id, companyId, message: "Accepted", status: "ACCEPTED" } });
    return prisma.tradeCase.update({ where: { id: tradeCase.id }, data: { acceptedProposalId: proposal.id } });
  }
  const [crossCaseA, crossCaseB] = await Promise.all([
    makeCrossCase("Cross Case A", crossCustomerA.id, crossCompanyA.id),
    makeCrossCase("Cross Case B", crossCustomerB.id, crossCompanyB.id),
  ]);

  await denied(() => uploadCaseDocument({ request: request(), caseId: caseOne.id, authenticatedUserId: outsider.id, fileDependencies: deps }));
  assert.equal(await prisma.caseDocument.count(), 0);
  const crossCaseStorage = new InMemorySecureObjectStorage(); const crossCaseDeps = { storage: crossCaseStorage, scanner: clean };
  const crossCaseDocumentA = await uploadCaseDocument({ request: request(), caseId: crossCaseA.id, authenticatedUserId: crossCustomerA.id, fileDependencies: crossCaseDeps });
  const crossCaseDocumentB = await uploadCaseDocument({ request: request(), caseId: crossCaseB.id, authenticatedUserId: crossCustomerB.id, fileDependencies: crossCaseDeps });
  await denied(() => uploadCaseDocument({ request: request(), caseId: crossCaseB.id, authenticatedUserId: crossCustomerA.id, fileDependencies: crossCaseDeps }));
  await denied(() => uploadCaseDocument({ request: request(), caseId: crossCaseA.id, authenticatedUserId: crossProviderB.id, fileDependencies: crossCaseDeps }));
  await denied(() => downloadCaseDocument({ documentId: crossCaseDocumentB.id, authenticatedUserId: crossCustomerA.id, objectStorage: crossCaseStorage }));
  await denied(() => downloadCaseDocument({ documentId: crossCaseDocumentA.id, authenticatedUserId: crossProviderB.id, objectStorage: crossCaseStorage }));
  await denied(() => deleteCaseDocument({ documentId: crossCaseDocumentB.id, authenticatedUserId: crossCustomerA.id, objectStorage: crossCaseStorage }));
  await denied(() => deleteCaseDocument({ documentId: crossCaseDocumentA.id, authenticatedUserId: crossProviderB.id, objectStorage: crossCaseStorage }));
  assert.equal((await downloadCaseDocument({ documentId: crossCaseDocumentA.id, authenticatedUserId: crossProviderA.id, objectStorage: crossCaseStorage })).status, 200);
  assert.equal((await downloadCaseDocument({ documentId: crossCaseDocumentB.id, authenticatedUserId: crossProviderB.id, objectStorage: crossCaseStorage })).status, 200);
  await deleteCaseDocument({ documentId: crossCaseDocumentA.id, authenticatedUserId: crossCustomerA.id, objectStorage: crossCaseStorage });
  await deleteCaseDocument({ documentId: crossCaseDocumentB.id, authenticatedUserId: crossCustomerB.id, objectStorage: crossCaseStorage });
  const oversizedCaseStorage = new CountingStorage(); const oversizedCaseScanner = new CountingScanner();
  await denied(() => uploadCaseDocument({ request: chunkedOversizedRequest(), caseId: caseOne.id, authenticatedUserId: customer.id,
    fileDependencies: { storage: oversizedCaseStorage, scanner: oversizedCaseScanner } }));
  assert.equal(oversizedCaseStorage.puts, 0); assert.equal(oversizedCaseScanner.calls, 0); assert.equal(await prisma.caseDocument.count(), 0);
  const caseFinalizationStorage = new FinalizationFailureStorage(() => prisma.tradeCase.delete({ where: { id: caseFinalization.id } }).then(() => undefined));
  await denied(() => uploadCaseDocument({ request: request(), caseId: caseFinalization.id, authenticatedUserId: customer.id,
    fileDependencies: { storage: caseFinalizationStorage, scanner: clean } }));
  assert.equal(await prisma.caseDocument.count({ where: { caseId: caseFinalization.id } }), 0);
  if (caseFinalizationStorage.lastKey) await denied(() => caseFinalizationStorage.head(caseFinalizationStorage.lastKey!));
  await denied(() => uploadCaseDocument({ request: request(Buffer.from("spoof")), caseId: caseOne.id, authenticatedUserId: customer.id, fileDependencies: deps }));
  await denied(() => uploadCaseDocument({ request: request(), caseId: caseOne.id, authenticatedUserId: customer.id,
    fileDependencies: { storage: new InMemorySecureObjectStorage(), scanner: new DeterministicStoredByteScanner("INFECTED") } }));
  await denied(() => uploadCaseDocument({ request: request(), caseId: caseOne.id, authenticatedUserId: customer.id,
    fileDependencies: { storage: new InMemorySecureObjectStorage(), scanner: new DeterministicStoredByteScanner("ERROR") } }));
  await denied(() => uploadCaseDocument({ request: request(), caseId: caseOne.id, authenticatedUserId: customer.id,
    fileDependencies: { storage: new PutFailureStorage(), scanner: clean } }));
  for (const corrupt of ["size", "hash"] as const) await denied(() => uploadCaseDocument({ request: request(), caseId: caseOne.id, authenticatedUserId: customer.id,
    fileDependencies: { storage: new CorruptReadStorage(corrupt), scanner: clean } }));
  assert.equal(await prisma.caseDocument.count(), 0);
  const caseDocument = await uploadCaseDocument({ request: request(), caseId: caseOne.id, authenticatedUserId: customer.id, fileDependencies: deps });
  const caseRow = await prisma.caseDocument.findUniqueOrThrow({ where: { id: caseDocument.id } });
  assert.equal(caseRow.scanStatus, "CLEAN"); assert.equal(caseRow.caseId, caseOne.id); assert.equal(caseRow.uploaderId, customer.id);
  const observedCaseDownload = new ObservedDownloadStorage();
  const caseResponse = await downloadCaseDocument({ documentId: caseRow.id, authenticatedUserId: provider.id, objectStorage: observedCaseDownload });
  assert(observedCaseDownload.pulls < 2);
  assert.equal(caseResponse.status, 200); assert.equal(caseResponse.headers.get("cache-control"), "private, no-store"); assert.equal(caseResponse.headers.get("x-content-type-options"), "nosniff");
  assert.equal(caseResponse.headers.get("content-type"), "application/pdf"); assert.match(caseResponse.headers.get("content-disposition") ?? "", /filename="evidence\.pdf"; filename\*=UTF-8''evidence\.pdf/);
  const caseReader = caseResponse.body!.getReader(); await caseReader.read(); await caseReader.cancel(); assert.equal(observedCaseDownload.cancelled, true);
  await denied(() => downloadCaseDocument({ documentId: caseRow.id, authenticatedUserId: outsider.id, objectStorage: storage }));
  await prisma.caseDocument.update({ where: { id: caseRow.id }, data: { scanStatus: "PENDING_SCAN" } });
  await denied(() => downloadCaseDocument({ documentId: caseRow.id, authenticatedUserId: customer.id, objectStorage: storage }));
  await prisma.caseDocument.update({ where: { id: caseRow.id }, data: { scanStatus: "CLEAN" } });
  const failingCaseDelete: SecureObjectStorage = {
    putImmutable: (key, body, contentType) => { void contentType; return storage.putImmutable(key, body); },
    get: (key) => storage.get(key), head: (key) => storage.head(key), remove: async () => { throw new Error("delete failure"); },
  };
  await deleteCaseDocument({ documentId: caseRow.id, authenticatedUserId: customer.id, objectStorage: failingCaseDelete });
  assert.equal(await prisma.caseDocument.count({ where: { id: caseRow.id } }), 0); await denied(() => deleteCaseDocument({ documentId: caseRow.id, authenticatedUserId: customer.id, objectStorage: storage }));
  for (const unsafeKey of ["../outside.pdf", path.resolve("storage", "private", "outside.pdf")]) {
    const unsafeLegacy = await prisma.caseDocument.create({ data: { caseId: caseOne.id, uploaderId: customer.id, name: "unsafe.pdf", storageKey: unsafeKey, storageProvider: "local", mimeType: "application/pdf" } });
    await denied(() => downloadCaseDocument({ documentId: unsafeLegacy.id, authenticatedUserId: customer.id }));
    await prisma.caseDocument.delete({ where: { id: unsafeLegacy.id } });
  }
  const legacyCaseKey = "11111111-1111-4111-8111-111111111111.pdf"; const legacyCasePath = path.join(process.cwd(), "storage", "private", "cases", legacyCaseKey);
  const legacyCaseOutsidePath = path.join(process.cwd(), "storage", "private", "case-reparse-target");
  await mkdir(path.dirname(legacyCasePath), { recursive: true }); await mkdir(legacyCaseOutsidePath); await symlink(legacyCaseOutsidePath, legacyCasePath, "junction");
  try {
    const symlinkLegacy = await prisma.caseDocument.create({ data: { caseId: caseOne.id, uploaderId: customer.id, name: "symlink.pdf", storageKey: legacyCaseKey, storageProvider: "local", mimeType: "application/pdf" } });
    await denied(() => downloadCaseDocument({ documentId: symlinkLegacy.id, authenticatedUserId: customer.id }));
    await prisma.caseDocument.delete({ where: { id: symlinkLegacy.id } }); await unlink(legacyCasePath);
    await writeFile(legacyCasePath, PDF, { flag: "wx" });
    const legacy = await prisma.caseDocument.create({ data: { caseId: caseOne.id, uploaderId: customer.id, name: "legacy.pdf", storageKey: legacyCaseKey, storageProvider: "local", mimeType: "application/pdf" } });
    assert.equal((await downloadCaseDocument({ documentId: legacy.id, authenticatedUserId: customer.id })).status, 200);
    await denied(() => downloadCaseDocument({ documentId: legacy.id, authenticatedUserId: outsider.id }));
    assert.equal((await prisma.caseDocument.findUniqueOrThrow({ where: { id: legacy.id } })).scanStatus, null);
    await prisma.caseDocument.delete({ where: { id: legacy.id } });
  } finally { await unlink(legacyCasePath).catch(() => undefined); await rmdir(legacyCaseOutsidePath).catch(() => undefined); await rmdir(path.dirname(legacyCasePath)).catch(() => undefined); }

  await denied(() => uploadProjectTaskAttachment({ request: request(), taskId: taskTwo.id, authenticatedUserId: outsider.id, fileDependencies: deps }));
  assert.equal(await prisma.projectTaskAttachment.count(), 0);
  const [crossProjectA, crossProjectB] = await Promise.all([
    prisma.project.create({ data: { tradeCaseId: crossCaseA.id, title: "Cross Project A", createdBy: crossCustomerA.id, assignedTo: crossProviderA.id } }),
    prisma.project.create({ data: { tradeCaseId: crossCaseB.id, title: "Cross Project B", createdBy: crossCustomerB.id, assignedTo: crossProviderB.id } }),
  ]);
  const [crossTaskA, crossTaskB, crossTaskBSibling] = await Promise.all([
    prisma.projectTask.create({ data: { projectId: crossProjectA.id, title: "Cross Task A" } }),
    prisma.projectTask.create({ data: { projectId: crossProjectB.id, title: "Cross Task B" } }),
    prisma.projectTask.create({ data: { projectId: crossProjectB.id, title: "Cross Task B Sibling" } }),
  ]);
  const crossTaskStorage = new InMemorySecureObjectStorage(); const crossTaskDeps = { storage: crossTaskStorage, scanner: clean };
  const crossAttachmentA = await uploadProjectTaskAttachment({ request: request(), taskId: crossTaskA.id, authenticatedUserId: crossProviderA.id, fileDependencies: crossTaskDeps });
  const crossAttachmentB = await uploadProjectTaskAttachment({ request: request(), taskId: crossTaskB.id, authenticatedUserId: crossProviderB.id, fileDependencies: crossTaskDeps });
  const crossAttachmentBSibling = await uploadProjectTaskAttachment({ request: request(), taskId: crossTaskBSibling.id, authenticatedUserId: crossCustomerB.id, fileDependencies: crossTaskDeps });
  await denied(() => uploadProjectTaskAttachment({ request: request(), taskId: crossTaskB.id, authenticatedUserId: crossProviderA.id, fileDependencies: crossTaskDeps }));
  await denied(() => uploadProjectTaskAttachment({ request: request(), taskId: crossTaskBSibling.id, authenticatedUserId: crossCustomerA.id, fileDependencies: crossTaskDeps }));
  for (const attachmentId of [crossAttachmentB.id, crossAttachmentBSibling.id]) {
    await denied(() => downloadProjectTaskAttachment({ attachmentId, authenticatedUserId: crossProviderA.id, objectStorage: crossTaskStorage }));
    await denied(() => deleteProjectTaskAttachment({ attachmentId, authenticatedUserId: crossCustomerA.id, objectStorage: crossTaskStorage }));
  }
  assert.equal((await downloadProjectTaskAttachment({ attachmentId: crossAttachmentA.id, authenticatedUserId: crossCustomerA.id, objectStorage: crossTaskStorage })).status, 200);
  assert.equal((await downloadProjectTaskAttachment({ attachmentId: crossAttachmentB.id, authenticatedUserId: crossCustomerB.id, objectStorage: crossTaskStorage })).status, 200);
  await deleteProjectTaskAttachment({ attachmentId: crossAttachmentA.id, authenticatedUserId: crossProviderA.id, objectStorage: crossTaskStorage });
  await deleteProjectTaskAttachment({ attachmentId: crossAttachmentB.id, authenticatedUserId: crossProviderB.id, objectStorage: crossTaskStorage });
  await deleteProjectTaskAttachment({ attachmentId: crossAttachmentBSibling.id, authenticatedUserId: crossCustomerB.id, objectStorage: crossTaskStorage });
  const oversizedTaskStorage = new CountingStorage(); const oversizedTaskScanner = new CountingScanner();
  await denied(() => uploadProjectTaskAttachment({ request: chunkedOversizedRequest(), taskId: taskOne.id, authenticatedUserId: provider.id,
    fileDependencies: { storage: oversizedTaskStorage, scanner: oversizedTaskScanner } }));
  assert.equal(oversizedTaskStorage.puts, 0); assert.equal(oversizedTaskScanner.calls, 0); assert.equal(await prisma.projectTaskAttachment.count(), 0);
  const taskFinalizationStorage = new FinalizationFailureStorage(() => prisma.projectTask.delete({ where: { id: taskFinalization.id } }).then(() => undefined));
  await denied(() => uploadProjectTaskAttachment({ request: request(), taskId: taskFinalization.id, authenticatedUserId: provider.id,
    fileDependencies: { storage: taskFinalizationStorage, scanner: clean } }));
  assert.equal(await prisma.projectTaskAttachment.count({ where: { taskId: taskFinalization.id } }), 0);
  if (taskFinalizationStorage.lastKey) await denied(() => taskFinalizationStorage.head(taskFinalizationStorage.lastKey!));
  await denied(() => uploadProjectTaskAttachment({ request: request(Buffer.from("spoof")), taskId: taskOne.id, authenticatedUserId: provider.id, fileDependencies: deps }));
  await denied(() => uploadProjectTaskAttachment({ request: request(), taskId: taskOne.id, authenticatedUserId: provider.id,
    fileDependencies: { storage: new InMemorySecureObjectStorage(), scanner: new DeterministicStoredByteScanner("INFECTED") } }));
  await denied(() => uploadProjectTaskAttachment({ request: request(), taskId: taskOne.id, authenticatedUserId: provider.id,
    fileDependencies: { storage: new InMemorySecureObjectStorage(), scanner: new DeterministicStoredByteScanner("ERROR") } }));
  await denied(() => uploadProjectTaskAttachment({ request: request(), taskId: taskOne.id, authenticatedUserId: provider.id,
    fileDependencies: { storage: new PutFailureStorage(), scanner: clean } }));
  for (const corrupt of ["size", "hash"] as const) await denied(() => uploadProjectTaskAttachment({ request: request(), taskId: taskOne.id, authenticatedUserId: provider.id,
    fileDependencies: { storage: new CorruptReadStorage(corrupt), scanner: clean } }));
  assert.equal(await prisma.projectTaskAttachment.count(), 0);
  const attachment = await uploadProjectTaskAttachment({ request: request(), taskId: taskOne.id, authenticatedUserId: provider.id, fileDependencies: deps });
  const taskRow = await prisma.projectTaskAttachment.findUniqueOrThrow({ where: { id: attachment.id } });
  assert.equal(taskRow.scanStatus, "CLEAN"); assert.equal(taskRow.taskId, taskOne.id); assert.equal(taskRow.uploadedById, provider.id);
  const observedTaskDownload = new ObservedDownloadStorage();
  const taskResponse = await downloadProjectTaskAttachment({ attachmentId: taskRow.id, authenticatedUserId: customer.id, objectStorage: observedTaskDownload });
  assert(observedTaskDownload.pulls < 2);
  assert.equal(taskResponse.status, 200); assert.equal(taskResponse.headers.get("cache-control"), "private, no-store");
  assert.equal(taskResponse.headers.get("x-content-type-options"), "nosniff"); assert.equal(taskResponse.headers.get("content-type"), "application/pdf");
  assert.match(taskResponse.headers.get("content-disposition") ?? "", /filename="evidence\.pdf"; filename\*=UTF-8''evidence\.pdf/);
  assert.deepEqual(Buffer.from(await taskResponse.arrayBuffer()), PDF); assert.equal(observedTaskDownload.pulls, 2);
  await denied(() => downloadProjectTaskAttachment({ attachmentId: taskRow.id, authenticatedUserId: outsider.id, objectStorage: storage }));
  await prisma.projectTaskAttachment.update({ where: { id: taskRow.id }, data: { scanStatus: "SCAN_FAILED" } });
  await denied(() => downloadProjectTaskAttachment({ attachmentId: taskRow.id, authenticatedUserId: provider.id, objectStorage: storage }));
  await prisma.projectTaskAttachment.update({ where: { id: taskRow.id }, data: { scanStatus: "CLEAN" } });
  const failingDelete: SecureObjectStorage = {
    putImmutable: (key, body, contentType) => { void contentType; return storage.putImmutable(key, body); },
    get: (key) => storage.get(key), head: (key) => storage.head(key),
    remove: async () => { throw new Error("delete failure"); },
  };
  await deleteProjectTaskAttachment({ attachmentId: taskRow.id, authenticatedUserId: provider.id, objectStorage: failingDelete });
  assert.equal(await prisma.projectTaskAttachment.count({ where: { id: taskRow.id } }), 0);
  await denied(() => deleteProjectTaskAttachment({ attachmentId: taskRow.id, authenticatedUserId: provider.id, objectStorage: storage }));
  for (const unsafeKey of ["../outside.pdf", path.resolve("storage", "private", "outside.pdf")]) {
    const unsafeLegacy = await prisma.projectTaskAttachment.create({ data: { taskId: taskOne.id, uploadedById: provider.id, fileName: "unsafe.pdf", storageKey: unsafeKey, storageProvider: "local", mimeType: "application/pdf" } });
    await denied(() => downloadProjectTaskAttachment({ attachmentId: unsafeLegacy.id, authenticatedUserId: provider.id }));
    await prisma.projectTaskAttachment.delete({ where: { id: unsafeLegacy.id } });
  }
  const legacyTaskKey = "22222222-2222-4222-8222-222222222222.pdf"; const legacyTaskPath = path.join(process.cwd(), "storage", "private", "project-task-attachments", legacyTaskKey);
  const legacyTaskOutsidePath = path.join(process.cwd(), "storage", "private", "task-reparse-target");
  await mkdir(path.dirname(legacyTaskPath), { recursive: true }); await mkdir(legacyTaskOutsidePath); await symlink(legacyTaskOutsidePath, legacyTaskPath, "junction");
  try {
    const symlinkLegacy = await prisma.projectTaskAttachment.create({ data: { taskId: taskOne.id, uploadedById: provider.id, fileName: "symlink.pdf", storageKey: legacyTaskKey, storageProvider: "local", mimeType: "application/pdf" } });
    await denied(() => downloadProjectTaskAttachment({ attachmentId: symlinkLegacy.id, authenticatedUserId: provider.id }));
    await prisma.projectTaskAttachment.delete({ where: { id: symlinkLegacy.id } }); await unlink(legacyTaskPath);
    await writeFile(legacyTaskPath, PDF, { flag: "wx" });
    const legacy = await prisma.projectTaskAttachment.create({ data: { taskId: taskOne.id, uploadedById: provider.id, fileName: "legacy-task.pdf", storageKey: legacyTaskKey, storageProvider: "local", mimeType: "application/pdf" } });
    assert.equal((await downloadProjectTaskAttachment({ attachmentId: legacy.id, authenticatedUserId: provider.id })).status, 200);
    await denied(() => downloadProjectTaskAttachment({ attachmentId: legacy.id, authenticatedUserId: outsider.id }));
    assert.equal((await prisma.projectTaskAttachment.findUniqueOrThrow({ where: { id: legacy.id } })).scanStatus, null);
    await prisma.projectTaskAttachment.delete({ where: { id: legacy.id } });
  } finally { await unlink(legacyTaskPath).catch(() => undefined); await rmdir(legacyTaskOutsidePath).catch(() => undefined); await rmdir(path.dirname(legacyTaskPath)).catch(() => undefined); }
  assert.equal(await prisma.caseDocument.count(), 0); assert.equal(await prisma.projectTaskAttachment.count(), 0);
  await prisma.$disconnect();
  console.log("Storage Batch B domain integration passed: exact-resource IDOR, bounded uploads, protected legacy paths, CLEAN downloads, streaming, and deletion semantics.");
}
void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Storage domain integration failed"); process.exitCode = 1; });
