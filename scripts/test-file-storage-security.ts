import assert from "node:assert/strict";
import net from "node:net";
import sharp from "sharp";
import { createQuarantineObjectKey, assertValidStorageObjectKey, STORAGE_OBJECT_KINDS } from "../lib/storage/object-key";
import { getObjectStorageConfig } from "../lib/storage/object-storage-config";
import { parseBoundedMultipartUpload } from "../lib/security/upload-request";
import { validateFileContent } from "../lib/storage/file-content-validation";
import { ClamAvUploadScanner } from "../lib/security/clamav-upload-scanner";
import { DeterministicStoredByteScanner, scanStoredObject, storeWithSha256 } from "../lib/storage/file-scan-workflow";
import { InMemorySecureObjectStorage } from "../lib/storage/secure-object-storage";
import { FileSecurityError } from "../lib/security/file-security-errors";
import { R2StorageProvider } from "../lib/storage/r2-storage-provider";
import type { ObjectStorageConfig } from "../lib/storage/object-storage-config";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { storeConfidentialUpload, readLegacyPrivateFile, streamBoundedObject } from "../lib/storage/confidential-file-storage";
import { createVerifiedPublicImageStream, storePublicImage } from "../lib/storage/public-image-storage";
import { resolveBackfillDatabaseUrl } from "./migrate-public-images";

async function rejects(operation: () => Promise<unknown> | unknown): Promise<void> {
  await assert.rejects(async () => operation(), FileSecurityError);
}

async function main(): Promise<void> {
for (const kind of STORAGE_OBJECT_KINDS) {
  const first = createQuarantineObjectKey(kind, new Date("2026-08-15T00:00:00Z"));
  const second = createQuarantineObjectKey(kind, new Date("2026-08-15T00:00:00Z"));
  assert.notEqual(first, second); assertValidStorageObjectKey(first); assert(!first.includes("customer.pdf"));
}
assert.throws(() => assertValidStorageObjectKey("../customer.pdf"), FileSecurityError);

const environment = { ...process.env };
Object.assign(process.env, {
  OBJECT_STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
  OBJECT_STORAGE_REGION: "auto", OBJECT_STORAGE_BUCKET: "private-files",
  OBJECT_STORAGE_ACCESS_KEY_ID: "abcdefgh", OBJECT_STORAGE_SECRET_ACCESS_KEY: "abcdefghijk",
});
assert.equal(getObjectStorageConfig().bucket, "private-files");
for (const endpoint of ["http://host.test", "https://user:pass@host.test", "https://host.test/?x=1", "https://host.test/#x"]) {
  process.env.OBJECT_STORAGE_ENDPOINT = endpoint; assert.throws(getObjectStorageConfig, FileSecurityError);
}
process.env.OBJECT_STORAGE_ENDPOINT = "https://account.r2.cloudflarestorage.com";
process.env.OBJECT_STORAGE_BUCKET = "replace-with-bucket"; assert.throws(getObjectStorageConfig, FileSecurityError);
process.env = environment;

function multipartRequest(body: Buffer, contentLength?: number): Request {
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(body); controller.close(); } });
  const headers: Record<string, string> = { "content-type": "multipart/form-data; boundary=test-boundary" };
  if (contentLength !== undefined) headers["content-length"] = String(contentLength);
  return new Request("http://localhost/upload", { method: "POST", headers, body: stream, duplex: "half" } as RequestInit);
}
function multipart(files = 1, fields = 0): Buffer {
  const lines: string[] = [];
  for (let index = 0; index < fields; index++) lines.push(`--test-boundary\r\nContent-Disposition: form-data; name="f${index}"\r\n\r\nv\r\n`);
  for (let index = 0; index < files; index++) lines.push(`--test-boundary\r\nContent-Disposition: form-data; name="file"; filename="x.pdf"\r\nContent-Type: application/pdf\r\n\r\nabc\r\n`);
  lines.push("--test-boundary--\r\n"); return Buffer.from(lines.join(""));
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(entries: ReadonlyArray<readonly [string, string]>): Buffer {
  const locals: Buffer[] = []; const central: Buffer[] = []; let offset = 0;
  for (const [nameText, valueText] of entries) {
    const name = Buffer.from(nameText); const value = Buffer.from(valueText); const checksum = crc32(value);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4);
    local.writeUInt32LE(checksum, 14); local.writeUInt32LE(value.length, 18); local.writeUInt32LE(value.length, 22); local.writeUInt16LE(name.length, 26);
    locals.push(local, name, value);
    const directory = Buffer.alloc(46); directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6);
    directory.writeUInt32LE(checksum, 16); directory.writeUInt32LE(value.length, 20); directory.writeUInt32LE(value.length, 24); directory.writeUInt16LE(name.length, 28); directory.writeUInt32LE(offset, 42);
    central.push(directory, name); offset += local.length + name.length + value.length;
  }
  const directoryBytes = Buffer.concat(central); const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directoryBytes.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directoryBytes, end]);
}
const normal = multipart();
assert.equal((await parseBoundedMultipartUpload(multipartRequest(normal), { maximumRequestBytes: normal.length, maximumFileBytes: 3 })).file.bytes.toString(), "abc");
assert.equal((await parseBoundedMultipartUpload(multipartRequest(normal, 1), { maximumRequestBytes: normal.length, maximumFileBytes: 3 })).file.bytes.length, 3);
await rejects(() => parseBoundedMultipartUpload(multipartRequest(multipart(2)), { maximumRequestBytes: 1000, maximumFileBytes: 10 }));
await rejects(() => parseBoundedMultipartUpload(multipartRequest(multipart(1, 17)), { maximumRequestBytes: 5000, maximumFileBytes: 10 }));
await rejects(() => parseBoundedMultipartUpload(multipartRequest(normal), { maximumRequestBytes: normal.length - 1, maximumFileBytes: 3 }));
const largeField = Buffer.from(`--test-boundary\r\nContent-Disposition: form-data; name="field"\r\n\r\n${"x".repeat(17 * 1024)}\r\n--test-boundary--\r\n`);
await rejects(() => parseBoundedMultipartUpload(multipartRequest(largeField), { maximumRequestBytes: largeField.length, maximumFileBytes: 3 }));
const malformed = new Request("http://localhost/upload", { method: "POST", headers: { "content-type": "multipart/form-data" }, body: "x" });
await rejects(() => parseBoundedMultipartUpload(malformed, { maximumRequestBytes: 10, maximumFileBytes: 3 }));
let cancelledOversizedReader = false; let oversizedPulls = 0; let oversizedSettlements = 0;
const cancellableOversizedBody = new ReadableStream<Uint8Array>({
  pull(controller) { oversizedPulls += 1; controller.enqueue(Buffer.alloc(8, 0x41)); },
  cancel() { cancelledOversizedReader = true; },
});
const cancellableOversizedRequest = new Request("http://localhost/upload", {
  method: "POST", headers: { "content-type": "multipart/form-data; boundary=test-boundary" },
  body: cancellableOversizedBody, duplex: "half",
} as RequestInit);
await parseBoundedMultipartUpload(cancellableOversizedRequest, { maximumRequestBytes: 16, maximumFileBytes: 8 })
  .then(() => { oversizedSettlements += 1; }, () => { oversizedSettlements += 1; });
assert.equal(oversizedSettlements, 1); assert.equal(cancelledOversizedReader, true); assert(oversizedPulls >= 3);

const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
await validateFileContent({ kind: "pdf", fileName: "x.pdf", mimeType: "application/pdf", bytes: pdf });
await rejects(() => validateFileContent({ kind: "pdf", fileName: "x.txt", mimeType: "application/pdf", bytes: pdf }));
await rejects(() => validateFileContent({ kind: "pdf", fileName: "x.pdf", mimeType: "application/pdf", bytes: pdf.subarray(0, 15) }));
for (const [kind, format, mime, extension] of [["jpeg", "jpeg", "image/jpeg", "jpg"], ["png", "png", "image/png", "png"], ["webp", "webp", "image/webp", "webp"]] as const) {
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).toFormat(format).toBuffer();
  await validateFileContent({ kind, fileName: `x.${extension}`, mimeType: mime, bytes: image });
  await rejects(() => validateFileContent({ kind, fileName: `x.${extension}`, mimeType: mime, bytes: image.subarray(0, 8) }));
}
const docxType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const xlsxType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml";
const docx = zip([["[Content_Types].xml", `<Types><Override ContentType="${docxType}"/></Types>`], ["word/document.xml", "<document/>"]]);
const xlsx = zip([["[Content_Types].xml", `<Types><Override ContentType="${xlsxType}"/></Types>`], ["xl/workbook.xml", "<workbook/>"]]);
await validateFileContent({ kind: "docx", fileName: "x.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: docx });
await validateFileContent({ kind: "xlsx", fileName: "x.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes: xlsx });
const traversal = zip([["[Content_Types].xml", `<Types><Override ContentType="${docxType}"/></Types>`], ["../word/document.xml", "<document/>"]]);
await rejects(() => validateFileContent({ kind: "docx", fileName: "x.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: traversal }));
const macro = zip([["[Content_Types].xml", `<Types><Override ContentType="${docxType}"/></Types>`], ["word/document.xml", "<document/>"], ["word/vbaProject.bin", "macro"]]);
await rejects(() => validateFileContent({ kind: "docx", fileName: "x.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: macro }));

const storage = new InMemorySecureObjectStorage(); const key = createQuarantineObjectKey("case-document");
const source = (async function* () { yield Buffer.from("stored bytes"); })();
const stored = await storeWithSha256(storage, key, source, "application/pdf");
assert.equal((await scanStoredObject({ storage, scanner: new DeterministicStoredByteScanner(), key, expectedSize: stored.size, expectedChecksumSha256: stored.checksumSha256 })).status, "CLEAN");
await rejects(() => scanStoredObject({ storage, scanner: new DeterministicStoredByteScanner(), key, expectedSize: stored.size + 1, expectedChecksumSha256: stored.checksumSha256 }));
await rejects(() => scanStoredObject({ storage, scanner: new DeterministicStoredByteScanner("INFECTED"), key, expectedSize: stored.size, expectedChecksumSha256: stored.checksumSha256 }));

let streamPulls = 0; let streamCancelled = false;
const incrementalSource = (async function* () {
  try { streamPulls += 1; yield Buffer.from("ab"); streamPulls += 1; yield Buffer.from("cd"); }
  finally { streamCancelled = true; }
})();
const incrementalStream = streamBoundedObject({ size: 4, body: incrementalSource });
assert.equal(streamPulls, 0);
const incrementalReader = incrementalStream.getReader();
assert.equal(Buffer.from((await incrementalReader.read()).value ?? []).toString(), "ab");
assert.equal(Buffer.from((await incrementalReader.read()).value ?? []).toString(), "cd");
assert.equal((await incrementalReader.read()).done, true);
const cancelSource = (async function* () { try { yield Buffer.from("a"); yield Buffer.from("b"); } finally { streamCancelled = true; } })();
streamCancelled = false;
const cancelReader = streamBoundedObject({ size: 2, body: cancelSource }).getReader();
await cancelReader.read(); await cancelReader.cancel(); assert.equal(streamCancelled, true);
let oversizedSourceReturned = false;
const oversizedSource = (async function* () { try { yield Buffer.from("abc"); } finally { oversizedSourceReturned = true; } })();
const oversizedStreamReader = streamBoundedObject({ size: 2, body: oversizedSource }).getReader();
await assert.rejects(() => oversizedStreamReader.read()); assert.equal(oversizedSourceReturned, true);

function fileMultipart(fileName: string, mimeType: string, bytes: Buffer): Buffer {
  return Buffer.concat([Buffer.from(`--test-boundary\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`), bytes, Buffer.from("\r\n--test-boundary--\r\n")]);
}
for (const domainKind of ["case-document", "project-attachment"] as const) {
  const domainStorage = new InMemorySecureObjectStorage();
  const requestBytes = fileMultipart("safe.pdf", "application/pdf", pdf);
  const uploaded = await storeConfidentialUpload({ request: multipartRequest(requestBytes), kind: domainKind,
    dependencies: { storage: domainStorage, scanner: new DeterministicStoredByteScanner() } });
  assert.equal(uploaded.scanStatus, "CLEAN"); assert.equal(uploaded.fileSize, pdf.length); assert.equal((await domainStorage.head(uploaded.storageKey)).size, pdf.length);
  const infectedStorage = new InMemorySecureObjectStorage();
  await rejects(() => storeConfidentialUpload({ request: multipartRequest(requestBytes), kind: domainKind,
    dependencies: { storage: infectedStorage, scanner: new DeterministicStoredByteScanner("INFECTED") } }));
  const invalidBytes = fileMultipart("spoof.pdf", "application/pdf", Buffer.from("not a pdf"));
  await rejects(() => storeConfidentialUpload({ request: multipartRequest(invalidBytes), kind: domainKind,
    dependencies: { storage: new InMemorySecureObjectStorage(), scanner: new DeterministicStoredByteScanner() } }));
}
await assert.rejects(() => readLegacyPrivateFile({ root: "cases", storageKey: "../outside.pdf" }));
await assert.rejects(() => readLegacyPrivateFile({ root: "project-task-attachments", storageKey: "C:\\outside.pdf" }));

const r2Config: ObjectStorageConfig = {
  endpoint: new URL("https://account.r2.cloudflarestorage.com"), region: "auto", bucket: "private-files",
  accessKeyId: "abcdefgh", secretAccessKey: "abcdefghijk", operationTimeoutMs: 100,
};
const sent: unknown[] = [];
const mockClient = { send: async (command: unknown) => {
  sent.push(command);
  if (command instanceof PutObjectCommand) {
    const body = command.input.Body as AsyncIterable<Uint8Array>;
    for await (const _chunk of body) void _chunk;
    return {};
  }
  const name = command?.constructor.name;
  if (name === "GetObjectCommand") return { ContentLength: 3, Body: (async function* () { yield Buffer.from("abc"); })() };
  if (name === "HeadObjectCommand") return { ContentLength: 3 };
  return {};
} } as unknown as ConstructorParameters<typeof R2StorageProvider>[1];
const r2 = new R2StorageProvider(r2Config, mockClient);
assert.equal((await r2.putImmutable(key, (async function* () { yield Buffer.from("abc"); })(), "application/pdf")).size, 3);
assert.equal((await r2.get(key)).size, 3); assert.equal((await r2.head(key)).size, 3); await r2.remove(key); assert.equal(sent.length, 4);
const notFoundClient = { send: async () => { throw { $metadata: { httpStatusCode: 404 } }; } } as unknown as ConstructorParameters<typeof R2StorageProvider>[1];
await rejects(() => new R2StorageProvider(r2Config, notFoundClient).get(key));
const timeoutClient = { send: async (_command: unknown, options: { abortSignal?: AbortSignal }) => new Promise((_resolve, reject) => {
  options.abortSignal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
}) } as unknown as ConstructorParameters<typeof R2StorageProvider>[1];
await rejects(() => new R2StorageProvider({ ...r2Config, operationTimeoutMs: 5 }, timeoutClient).head(key));

const server = net.createServer((socket) => {
  let received = Buffer.alloc(0); socket.on("data", (chunk) => { received = Buffer.concat([received, chunk]); });
  socket.on("end", () => { assert.equal(received.subarray(0, 10).toString(), "zINSTREAM\0"); socket.end("stream: OK\0"); });
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address(); assert(address && typeof address === "object");
const scanner = new ClamAvUploadScanner({ host: "127.0.0.1", port: address.port, timeoutMs: 1000 });
assert.equal(await scanner.scanStream((async function* () { yield Buffer.from("safe"); })()), "CLEAN");
await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));

for (const format of ["jpeg", "png", "webp"] as const) {
  const source = sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).withMetadata({
    exif: { IFD0: { Artist: "remove-me" } },
  });
  const bytes = await source[format]().toBuffer();
  const mimeType = `image/${format}`.replace("image/jpeg", "image/jpeg");
  const extension = format === "jpeg" ? "jpg" : format;
  const imageStorage = new InMemorySecureObjectStorage();
  const result = await storePublicImage({
    file: new File([new Uint8Array(bytes)], `safe.${extension}`, { type: mimeType }),
    kind: "company-logo",
    dependencies: { storage: imageStorage, scanner: new DeterministicStoredByteScanner() },
  });
  assert.equal(result.scanStatus, "CLEAN");
  assert.equal(result.scanAttempts, 1);
  const normalized = await imageStorage.get(result.storageKey);
  const chunks: Buffer[] = [];
  for await (const chunk of normalized.body) chunks.push(Buffer.from(chunk));
  const metadata = await sharp(Buffer.concat(chunks)).metadata();
  assert.equal(metadata.format, format);
  assert.equal(metadata.exif, undefined);
}

const smallPng = await sharp({ create: { width: 1, height: 1, channels: 3, background: "blue" } }).png().toBuffer();
const noAccessStorage = new InMemorySecureObjectStorage();
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(smallPng)], "spoof.jpg", { type: "image/jpeg" }), kind: "expert-image",
  dependencies: { storage: noAccessStorage, scanner: new DeterministicStoredByteScanner() },
}));
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(Buffer.from("<svg/>"))], "x.svg", { type: "image/svg+xml" }), kind: "expert-image",
  dependencies: { storage: noAccessStorage, scanner: new DeterministicStoredByteScanner() },
}));
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(Buffer.from("not-an-image"))], "x.png", { type: "image/png" }), kind: "expert-image",
  dependencies: { storage: noAccessStorage, scanner: new DeterministicStoredByteScanner() },
}));
const tooWide = await sharp({ create: { width: 8193, height: 1, channels: 3, background: "black" } }).png().toBuffer();
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(tooWide)], "wide.png", { type: "image/png" }), kind: "opportunity-image",
  dependencies: { storage: noAccessStorage, scanner: new DeterministicStoredByteScanner() },
}));
const tooTall = await sharp({ create: { width: 1, height: 8193, channels: 3, background: "black" } }).png().toBuffer();
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(tooTall)], "tall.png", { type: "image/png" }), kind: "opportunity-image",
  dependencies: { storage: noAccessStorage, scanner: new DeterministicStoredByteScanner() },
}));
const tooManyPixels = await sharp({ create: { width: 5001, height: 5000, channels: 3, background: "black" } }).png().toBuffer();
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(tooManyPixels)], "pixels.png", { type: "image/png" }), kind: "opportunity-image",
  dependencies: { storage: noAccessStorage, scanner: new DeterministicStoredByteScanner() },
}));
const animatedFrames = await Promise.all(["red", "blue"].map((background) =>
  sharp({ create: { width: 2, height: 2, channels: 4, background } }).png().toBuffer(),
));
const animatedWebp = await sharp(animatedFrames, { join: { animated: true } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(animatedWebp)], "animated.webp", { type: "image/webp" }), kind: "opportunity-image",
  dependencies: { storage: noAccessStorage, scanner: new DeterministicStoredByteScanner() },
}));
const infectedStorage = new InMemorySecureObjectStorage();
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(smallPng)], "infected.png", { type: "image/png" }), kind: "opportunity-image",
  dependencies: { storage: infectedStorage, scanner: new DeterministicStoredByteScanner("INFECTED") },
}));
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(smallPng)], "scanner-error.png", { type: "image/png" }), kind: "opportunity-image",
  dependencies: { storage: new InMemorySecureObjectStorage(), scanner: new DeterministicStoredByteScanner("ERROR") },
}));
class PublicImagePutFailureStorage extends InMemorySecureObjectStorage {
  cleanupCalls = 0;
  override async putImmutable(): Promise<{ size: number }> { throw new FileSecurityError("storage_failure"); }
  override async remove(key: string): Promise<void> { this.cleanupCalls += 1; await super.remove(key); }
}
const publicPutFailure = new PublicImagePutFailureStorage();
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(smallPng)], "write.png", { type: "image/png" }), kind: "company-logo",
  dependencies: { storage: publicPutFailure, scanner: new DeterministicStoredByteScanner() },
}));
assert.equal(publicPutFailure.cleanupCalls, 1);
class PublicImageSizeMismatchStorage extends InMemorySecureObjectStorage {
  cleanupCalls = 0;
  override async putImmutable(key: string, body: AsyncIterable<Uint8Array>): Promise<{ size: number }> {
    const storedResult = await super.putImmutable(key, body); return { size: storedResult.size + 1 };
  }
  override async remove(key: string): Promise<void> { this.cleanupCalls += 1; await super.remove(key); }
}
const publicSizeMismatch = new PublicImageSizeMismatchStorage();
await rejects(() => storePublicImage({
  file: new File([new Uint8Array(smallPng)], "size.png", { type: "image/png" }), kind: "company-logo",
  dependencies: { storage: publicSizeMismatch, scanner: new DeterministicStoredByteScanner() },
}));
assert.equal(publicSizeMismatch.cleanupCalls, 1);

const streamBytes = Buffer.from("multi-chunk-image");
const streamHash = (await import("node:crypto")).createHash("sha256").update(streamBytes).digest("hex");
let pulls = 0;
let returned = false;
const incrementalBody = {
  [Symbol.asyncIterator]() {
    let index = 0;
    const chunks = [streamBytes.subarray(0, 5), streamBytes.subarray(5, 11), streamBytes.subarray(11)];
    return {
      async next() { pulls += 1; return index < chunks.length ? { done: false as const, value: chunks[index++] } : { done: true as const, value: undefined }; },
      async return() { returned = true; return { done: true as const, value: undefined }; },
    };
  },
};
const publicImageReader = createVerifiedPublicImageStream({
  object: { body: incrementalBody, size: streamBytes.length }, expectedSize: streamBytes.length, expectedChecksumSha256: streamHash,
}).getReader();
assert.equal(pulls, 0, "public image stream must not eagerly consume its source");
const firstChunk = await publicImageReader.read();
assert.equal(Buffer.from(firstChunk.value ?? []).toString(), "multi");
assert.equal(pulls, 1, "one downstream read must pull only one upstream chunk");
await publicImageReader.cancel();
assert.equal(returned, true, "downstream cancellation must close the upstream iterator");

async function consumeStream(stream: ReadableStream<Uint8Array>): Promise<void> {
  const reader = stream.getReader();
  while (!(await reader.read()).done) { /* consume */ }
}
await assert.rejects(() => consumeStream(createVerifiedPublicImageStream({
  object: { size: 3, body: (async function* () { yield Buffer.from("ab"); })() },
  expectedSize: 3, expectedChecksumSha256: streamHash,
})));
let overrunReturned = false;
const overrunBody = {
  [Symbol.asyncIterator]() {
    let done = false;
    return {
      async next() { if (done) return { done: true as const, value: undefined }; done = true; return { done: false as const, value: Buffer.from("abcd") }; },
      async return() { overrunReturned = true; return { done: true as const, value: undefined }; },
    };
  },
};
await assert.rejects(() => consumeStream(createVerifiedPublicImageStream({
  object: { size: 3, body: overrunBody }, expectedSize: 3, expectedChecksumSha256: streamHash,
})));
assert.equal(overrunReturned, true, "overrun must terminate the upstream iterator");

assert.throws(() => resolveBackfillDatabaseUrl({}, []), /TEST_DATABASE_URL/);
assert.throws(() => resolveBackfillDatabaseUrl({ TEST_DATABASE_URL: "postgresql://u:p@db.example.test/db" }, []), /loopback/);
assert.throws(() => resolveBackfillDatabaseUrl({
  TEST_DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/test",
  DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/test",
}, []), /must differ/);
assert.equal(resolveBackfillDatabaseUrl({
  TEST_DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/test",
  DATABASE_URL: "postgresql://u:p@remote.example.test/prod",
}, []), "postgresql://u:p@127.0.0.1:5432/test");
assert.throws(() => resolveBackfillDatabaseUrl({ DATABASE_URL: "postgresql://u:p@remote.example.test/prod" }, ["--production", "--apply"]), /acknowledge/);

console.log("File-storage security runtime tests passed.");
}

main().catch((error: unknown) => { throw error; });
