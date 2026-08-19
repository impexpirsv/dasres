import { AppError } from "../errors";
import Busboy from "busboy";
import { once } from "node:events";
import { FileSecurityError } from "./file-security-errors";
import { FILE_SECURITY_LIMITS } from "./file-security-limits";

const MEBIBYTE = 1024 * 1024;

export const UPLOAD_REQUEST_LIMITS = {
  IMAGE: 6 * MEBIBYTE,
  CONFIDENTIAL_DOCUMENT: 11 * MEBIBYTE,
} as const;

export function assertUploadRequestSize(
  request: Request,
  maximumRequestBytes: number,
): void {
  const contentLength = request.headers.get("content-length");

  if (contentLength === null) return;

  if (!/^(0|[1-9]\d*)$/.test(contentLength)) {
    throw new AppError("INVALID_CONTENT_LENGTH", 400, {
      code: "INVALID_CONTENT_LENGTH",
    });
  }

  const declaredBytes = Number(contentLength);

  if (
    !Number.isSafeInteger(declaredBytes) ||
    declaredBytes > maximumRequestBytes
  ) {
    throw new AppError("PAYLOAD_TOO_LARGE", 413, {
      code: "PAYLOAD_TOO_LARGE",
    });
  }
}

export type BoundedMultipartUpload = {
  file: { fieldName: string; fileName: string; mimeType: string; bytes: Buffer };
  fields: Readonly<Record<string, string>>;
};

export type BoundedMultipartForm = {
  file: BoundedMultipartUpload["file"] | null;
  fields: Readonly<Record<string, string>>;
};

type MultipartOptions = {
  maximumRequestBytes: number;
  maximumFileBytes: number;
  fileField?: string;
  requireFile: boolean;
};

export async function parseBoundedMultipartUpload(
  request: Request,
  options: { maximumRequestBytes: number; maximumFileBytes: number; fileField?: string },
): Promise<BoundedMultipartUpload> {
  const parsed = await parseBoundedMultipart(request, {
    ...options,
    requireFile: true,
  });

  if (!parsed.file) {
    throw new FileSecurityError("invalid_upload", 400);
  }

  return { file: parsed.file, fields: parsed.fields };
}

export async function parseBoundedMultipartFormData(
  request: Request,
  options: {
    maximumRequestBytes: number;
    maximumFileBytes: number;
    fileField: string;
  },
): Promise<FormData> {
  const parsed = await parseBoundedMultipart(request, {
    ...options,
    requireFile: false,
  });
  const formData = new FormData();

  for (const [name, value] of Object.entries(parsed.fields)) {
    formData.set(name, value);
  }

  if (parsed.file) {
    formData.set(
      parsed.file.fieldName,
      new File([new Uint8Array(parsed.file.bytes)], parsed.file.fileName, {
        type: parsed.file.mimeType,
      }),
    );
  }

  return formData;
}

async function parseBoundedMultipart(
  request: Request,
  options: MultipartOptions,
): Promise<BoundedMultipartForm> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;.*boundary=/i.test(contentType) || !request.body) {
    throw new FileSecurityError("invalid_upload", 400);
  }
  assertUploadRequestSize(request, options.maximumRequestBytes);
  const headers: Record<string, string> = { "content-type": contentType };
  const length = request.headers.get("content-length");
  if (length) headers["content-length"] = length;

  let parser: ReturnType<typeof Busboy>;
  try {
    parser = Busboy({ headers, limits: {
      files: FILE_SECURITY_LIMITS.multipartFileCount,
      fields: FILE_SECURITY_LIMITS.multipartFieldCount,
      fieldSize: FILE_SECURITY_LIMITS.multipartFieldBytes,
      // One extra parser byte lets the application distinguish exact-limit
      // payloads from oversized payloads without rejecting the former.
      fileSize: options.maximumFileBytes + 1,
      parts: FILE_SECURITY_LIMITS.multipartFieldCount + FILE_SECURITY_LIMITS.multipartFileCount,
    } });
  } catch { throw new FileSecurityError("invalid_upload", 400); }

  const fields: Record<string, string> = {};
  const chunks: Buffer[] = [];
  let file: BoundedMultipartUpload["file"] | undefined;
  let invalid = false;
  // Keep a permanent listener because an intentional early destroy (for an
  // authoritative byte-limit failure) may emit after the parsing promise exits.
  parser.on("error", () => { invalid = true; });
  parser.on("field", (name, value, info) => {
    if (info.valueTruncated || Object.hasOwn(fields, name)) invalid = true;
    fields[name] = value;
  });
  parser.on("file", (fieldName, stream, info) => {
    if (file || fieldName !== (options.fileField ?? "file")) invalid = true;
    file = { fieldName, fileName: info.filename, mimeType: info.mimeType, bytes: Buffer.alloc(0) };
    // Busboy can report a truncated file asynchronously after the parser is
    // intentionally destroyed for an authoritative request-size rejection.
    // Consume that stream error so a rejected upload cannot crash the process.
    stream.on("error", () => { invalid = true; });
    stream.on("limit", () => { invalid = true; });
    stream.on("data", (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk));
      if (chunks.reduce((sum, value) => sum + value.length, 0) > options.maximumFileBytes) invalid = true;
    });
  });
  parser.on("filesLimit", () => { invalid = true; });
  parser.on("fieldsLimit", () => { invalid = true; });
  parser.on("partsLimit", () => { invalid = true; });

  const completed = once(parser, "finish");
  const reader = request.body.getReader();
  let total = 0;
  try {
    while (true) {
      const read = await reader.read();
      if (read.done) break;
      const chunk = Buffer.from(read.value);
      total += chunk.length;
      if (total > options.maximumRequestBytes) throw new FileSecurityError("payload_too_large", 413);
      if (!parser.write(chunk)) await once(parser, "drain");
    }
    parser.end();
    await completed;
  } catch (error) {
    parser.destroy();
    await reader.cancel(error).catch(() => undefined);
    await completed.catch(() => undefined);
    if (error instanceof FileSecurityError) throw error;
    throw new FileSecurityError("invalid_upload", 400);
  }
  if (invalid || (options.requireFile && !file)) throw new FileSecurityError("invalid_upload", 400);
  if (file) {
    file.bytes = Buffer.concat(chunks);
    if (file.bytes.length > options.maximumFileBytes) throw new FileSecurityError("payload_too_large", 413);
  }
  return { file: file ?? null, fields };
}
