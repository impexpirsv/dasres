export const UPLOAD_SCAN_RESULTS = [
  "CLEAN",
  "INFECTED",
  "SUSPICIOUS",
  "ERROR",
] as const;

export type UploadScanResult =
  (typeof UPLOAD_SCAN_RESULTS)[number];

export type UploadScanInput = {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
};

export interface UploadScanner {
  scan(
    input: UploadScanInput,
  ): Promise<UploadScanResult>;
}

export class NoOpUploadScanner
  implements UploadScanner
{
  async scan(
    _input: UploadScanInput,
  ): Promise<UploadScanResult> {
    void _input;
    return "CLEAN";
  }
}

// Batch A compatibility boundary: legacy, not-yet-migrated flows deliberately keep
// this scanner. Secure storage workflows must inject a StoredByteScanner and can
// never obtain this no-op implementation through an implicit production fallback.
export const uploadScanner: UploadScanner =
  new NoOpUploadScanner();

export async function assertUploadIsClean(
  input: UploadScanInput,
  scanner: UploadScanner = uploadScanner,
): Promise<void> {
  let result: UploadScanResult;

  try {
    result = await scanner.scan(input);
  } catch {
    throw new AppError(
      "UPLOAD_SCAN_FAILED",
      503,
      { code: "UPLOAD_SCAN_FAILED" },
    );
  }

  switch (result) {
    case "CLEAN":
      return;
    case "INFECTED":
      throw new AppError(
        "UPLOAD_INFECTED",
        422,
        { code: "UPLOAD_INFECTED" },
      );
    case "SUSPICIOUS":
      throw new AppError(
        "UPLOAD_SUSPICIOUS",
        422,
        { code: "UPLOAD_SUSPICIOUS" },
      );
    case "ERROR":
      throw new AppError(
        "UPLOAD_SCAN_FAILED",
        503,
        { code: "UPLOAD_SCAN_FAILED" },
      );
    default:
      throw new AppError(
        "UPLOAD_SCAN_FAILED",
        503,
        { code: "UPLOAD_SCAN_FAILED" },
      );
  }
}
import { AppError } from "../errors";
