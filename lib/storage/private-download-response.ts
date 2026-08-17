import path from "path";

function sanitizeDownloadFileName(fileName: string): string {
  const normalized = path.basename(fileName).normalize("NFKC");
  const safe = normalized
    .replace(/[\u0000-\u001f\u007f"\\]/g, "_")
    .trim()
    .slice(0, 180);
  return safe || "download";
}

export function createPrivateDownloadResponse({
  body,
  contentLength,
  fileName,
  mimeType,
}: {
  body: BodyInit;
  contentLength: number;
  fileName: string;
  mimeType: string;
}): Response {
  const safeFileName = sanitizeDownloadFileName(fileName);
  const encodedFileName = encodeURIComponent(safeFileName);

  return new Response(body, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
      "Content-Length": String(contentLength),
      "Content-Type": mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
