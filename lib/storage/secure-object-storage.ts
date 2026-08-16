import { FileSecurityError } from "../security/file-security-errors";

export type ObjectBody = AsyncIterable<Uint8Array>;

export interface StoredObject {
  body: ObjectBody;
  size: number;
}

export interface SecureObjectStorage {
  putImmutable(key: string, body: ObjectBody, contentType: string): Promise<{ size: number }>;
  get(key: string): Promise<StoredObject>;
  head(key: string): Promise<{ size: number }>;
  remove(key: string): Promise<void>;
}

export class InMemorySecureObjectStorage implements SecureObjectStorage {
  private readonly objects = new Map<string, Buffer>();

  async putImmutable(key: string, body: ObjectBody): Promise<{ size: number }> {
    if (this.objects.has(key)) throw new FileSecurityError("already_exists");
    const chunks: Buffer[] = [];
    for await (const chunk of body) chunks.push(Buffer.from(chunk));
    const bytes = Buffer.concat(chunks);
    this.objects.set(key, bytes);
    return { size: bytes.length };
  }

  async get(key: string): Promise<StoredObject> {
    const bytes = this.objects.get(key);
    if (!bytes) throw new FileSecurityError("not_found");
    return { size: bytes.length, body: (async function* () { yield bytes; })() };
  }

  async head(key: string): Promise<{ size: number }> {
    const bytes = this.objects.get(key);
    if (!bytes) throw new FileSecurityError("not_found");
    return { size: bytes.length };
  }

  async remove(key: string): Promise<void> { this.objects.delete(key); }
}
