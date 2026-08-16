export const MEBIBYTE = 1024 * 1024;

export const FILE_SECURITY_LIMITS = {
  publicImageBytes: 5 * MEBIBYTE,
  confidentialDocumentBytes: 10 * MEBIBYTE,
  imageMultipartBytes: 6 * MEBIBYTE,
  documentMultipartBytes: 11 * MEBIBYTE,
  scannerStreamBytes: 12 * MEBIBYTE,
  scannerTimeoutMs: 15_000,
  storageOperationTimeoutMs: 10_000,
  multipartFieldCount: 16,
  multipartFieldBytes: 16 * 1024,
  multipartFileCount: 1,
  ooxmlEntryCount: 1_000,
  ooxmlExpandedBytes: 50 * MEBIBYTE,
  ooxmlCompressionRatio: 100,
  scannerResponseBytes: 4 * 1024,
} as const;
