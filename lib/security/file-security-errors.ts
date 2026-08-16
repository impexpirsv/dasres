import { AppError } from "../errors";

export type FileSecurityErrorCategory =
  | "configuration"
  | "invalid_key"
  | "already_exists"
  | "not_found"
  | "storage_timeout"
  | "storage_failure"
  | "invalid_upload"
  | "payload_too_large"
  | "invalid_content"
  | "scanner_timeout"
  | "scanner_unavailable"
  | "scanner_protocol"
  | "infected"
  | "suspicious"
  | "integrity_mismatch";

export class FileSecurityError extends AppError {
  constructor(
    readonly category: FileSecurityErrorCategory,
    status = 500,
  ) {
    super("FILE_SECURITY_OPERATION_FAILED", status, {
      code: "FILE_SECURITY_OPERATION_FAILED",
      details: { category },
      exposeDetails: false,
    });
    this.name = "FileSecurityError";
  }
}
