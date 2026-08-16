import "server-only";
import net from "node:net";
import { once } from "node:events";
import { FileSecurityError } from "./file-security-errors";
import { FILE_SECURITY_LIMITS } from "./file-security-limits";
import type { UploadScanResult } from "./upload-scanner";

export type ClamAvConfig = Readonly<{ host: string; port: number; timeoutMs: number }>;
const PLACEHOLDER = /(?:example|replace|your[-_ ])/i;

export function getClamAvConfig(): ClamAvConfig {
  const host = process.env.MALWARE_SCANNER_HOST?.trim() ?? "";
  const portText = process.env.MALWARE_SCANNER_PORT?.trim() ?? "";
  const timeoutText = process.env.MALWARE_SCAN_TIMEOUT_MS?.trim() || String(FILE_SECURITY_LIMITS.scannerTimeoutMs);
  if (!host || PLACEHOLDER.test(host) || /[\s\0\/\\]/.test(host) || !/^\d+$/.test(portText) || !/^\d+$/.test(timeoutText))
    throw new FileSecurityError("configuration", 503);
  const port = Number(portText); const timeoutMs = Number(timeoutText);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || timeoutMs < 100 || timeoutMs > 60_000)
    throw new FileSecurityError("configuration", 503);
  return { host, port, timeoutMs };
}

export class ClamAvUploadScanner {
  constructor(private readonly config: ClamAvConfig = getClamAvConfig()) {}

  async scanStream(body: AsyncIterable<Uint8Array>): Promise<UploadScanResult> {
    const socket = net.createConnection({ host: this.config.host, port: this.config.port });
    socket.setNoDelay(true);
    const timeout = setTimeout(() => socket.destroy(new Error("timeout")), this.config.timeoutMs);
    const response: Buffer[] = []; let responseBytes = 0; let suppliedBytes = 0;
    socket.on("data", (chunk: Buffer) => {
      responseBytes += chunk.length;
      if (responseBytes > FILE_SECURITY_LIMITS.scannerResponseBytes) socket.destroy(new Error("response"));
      else response.push(Buffer.from(chunk));
    });
    try {
      await once(socket, "connect");
      socket.write("zINSTREAM\0");
      for await (const raw of body) {
        const chunk = Buffer.from(raw); suppliedBytes += chunk.length;
        if (suppliedBytes > FILE_SECURITY_LIMITS.scannerStreamBytes) throw new FileSecurityError("payload_too_large", 413);
        const length = Buffer.allocUnsafe(4); length.writeUInt32BE(chunk.length);
        if (!socket.write(length) || !socket.write(chunk)) await once(socket, "drain");
      }
      socket.end(Buffer.alloc(4));
      await once(socket, "close");
      const text = Buffer.concat(response).toString("utf8");
      if (!text.endsWith("\0") && !text.endsWith("\n")) throw new FileSecurityError("scanner_protocol", 503);
      if (/stream: OK[\0\n]$/.test(text)) return "CLEAN";
      if (/stream: .+ FOUND[\0\n]$/.test(text)) return "INFECTED";
      if (/stream: .+ (?:WARNING|SUSPICIOUS)[\0\n]$/.test(text)) return "SUSPICIOUS";
      return "ERROR";
    } catch (error) {
      if (error instanceof FileSecurityError) throw error;
      throw new FileSecurityError("scanner_unavailable", 503);
    } finally { clearTimeout(timeout); socket.destroy(); }
  }
}
