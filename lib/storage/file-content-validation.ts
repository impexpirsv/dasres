import "server-only";
import path from "node:path";
import sharp from "sharp";
import yauzl, { type Entry, type ZipFile } from "yauzl";
import { FileSecurityError } from "../security/file-security-errors";
import { FILE_SECURITY_LIMITS } from "../security/file-security-limits";

export const FILE_CONTENT_KINDS = ["pdf", "docx", "xlsx", "jpeg", "png", "webp"] as const;
export type FileContentKind = (typeof FILE_CONTENT_KINDS)[number];

const POLICY: Record<FileContentKind, { extensions: string[]; mimeTypes: string[] }> = {
  pdf: { extensions: [".pdf"], mimeTypes: ["application/pdf"] },
  docx: { extensions: [".docx"], mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
  xlsx: { extensions: [".xlsx"], mimeTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] },
  jpeg: { extensions: [".jpg", ".jpeg"], mimeTypes: ["image/jpeg"] },
  png: { extensions: [".png"], mimeTypes: ["image/png"] },
  webp: { extensions: [".webp"], mimeTypes: ["image/webp"] },
};

export async function validateFileContent(input: {
  kind: FileContentKind; fileName: string; mimeType: string; bytes: Uint8Array;
}): Promise<void> {
  const bytes = Buffer.from(input.bytes); const policy = POLICY[input.kind];
  const extension = path.extname(input.fileName).toLowerCase();
  if (!policy.extensions.includes(extension) || !policy.mimeTypes.includes(input.mimeType.toLowerCase())) invalid();
  if (input.kind === "pdf") return validatePdf(bytes);
  if (input.kind === "docx" || input.kind === "xlsx") return validateOoxml(bytes, input.kind);
  try {
    const metadata = await sharp(bytes, { failOn: "warning", limitInputPixels: 40_000_000 }).metadata();
    const expected = input.kind === "jpeg" ? "jpeg" : input.kind;
    if (metadata.format !== expected || !metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1) invalid();
  } catch { invalid(); }
}

function invalid(): never { throw new FileSecurityError("invalid_content", 422); }

function validatePdf(bytes: Buffer): void {
  if (bytes.length < 12 || !bytes.subarray(0, 8).toString("ascii").match(/^%PDF-[12]\.[0-9]/)) invalid();
  const tail = bytes.subarray(Math.max(0, bytes.length - 1024)).toString("latin1").trimEnd();
  if (!tail.endsWith("%%EOF")) invalid();
}

async function readEntry(zip: ZipFile, entry: Entry, limit = 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => zip.openReadStream(entry, (error, stream) => {
    if (error || !stream) return reject(error ?? new Error("stream"));
    const chunks: Buffer[] = []; let size = 0;
    stream.on("data", (chunk: Buffer) => { size += chunk.length; if (size > limit) stream.destroy(new Error("limit")); else chunks.push(Buffer.from(chunk)); });
    stream.once("error", reject); stream.once("end", () => resolve(Buffer.concat(chunks)));
  }));
}

function openZip(bytes: Buffer): Promise<ZipFile> {
  return new Promise((resolve, reject) => yauzl.fromBuffer(bytes, {
    lazyEntries: true, validateEntrySizes: true, strictFileNames: true,
  }, (error, zip) => error || !zip ? reject(error ?? new Error("zip")) : resolve(zip)));
}

async function validateOoxml(bytes: Buffer, kind: "docx" | "xlsx"): Promise<void> {
  let zip: ZipFile | undefined;
  try {
    zip = await openZip(bytes);
    let count = 0; let expanded = 0; let contentTypes: Buffer | undefined; let hasMain = false;
    await new Promise<void>((resolve, reject) => {
      zip!.once("error", reject);
      zip!.once("end", resolve);
      zip!.on("entry", async (entry: Entry) => {
        try {
          count += 1; expanded += entry.uncompressedSize;
          const name = entry.fileName;
          const normalized = name.replace(/\\/g, "/");
          const ratio = entry.compressedSize === 0 ? (entry.uncompressedSize === 0 ? 1 : Infinity) : entry.uncompressedSize / entry.compressedSize;
          if (count > FILE_SECURITY_LIMITS.ooxmlEntryCount || expanded > FILE_SECURITY_LIMITS.ooxmlExpandedBytes || ratio > FILE_SECURITY_LIMITS.ooxmlCompressionRatio ||
            (entry.generalPurposeBitFlag & 1) !== 0 || normalized.startsWith("/") || normalized.split("/").includes("..") ||
            /(?:^|\/)(?:vbaProject\.bin|[^/]+\.(?:zip|7z|rar|docm|xlsm|exe|js|html?|svg))$/i.test(normalized)) invalid();
          if (normalized === "[Content_Types].xml") contentTypes = await readEntry(zip!, entry);
          if (normalized === (kind === "docx" ? "word/document.xml" : "xl/workbook.xml")) hasMain = true;
          zip!.readEntry();
        } catch (error) { reject(error); zip!.close(); }
      });
      zip!.readEntry();
    });
    const requiredType = kind === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml";
    if (!hasMain || !contentTypes?.toString("utf8").includes(requiredType)) invalid();
  } catch (error) {
    if (error instanceof FileSecurityError) throw error;
    invalid();
  } finally { zip?.close(); }
}
