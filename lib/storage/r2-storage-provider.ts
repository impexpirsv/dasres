import "server-only";
import { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { FileSecurityError } from "../security/file-security-errors";
import { assertValidStorageObjectKey } from "./object-key";
import { getObjectStorageConfig, type ObjectStorageConfig } from "./object-storage-config";
import type { ObjectBody, SecureObjectStorage, StoredObject } from "./secure-object-storage";

type S3Sender = Pick<S3Client, "send">;

export class R2StorageProvider implements SecureObjectStorage {
  private readonly client: S3Sender;
  constructor(private readonly config: ObjectStorageConfig = getObjectStorageConfig(), client?: S3Sender) {
    this.client = client ?? new S3Client({
      endpoint: config.endpoint.toString(),
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      forcePathStyle: true,
    });
  }

  private assertKey(key: string): void { assertValidStorageObjectKey(key); }

  private async execute<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.operationTimeoutMs);
    try { return await operation(controller.signal); }
    catch (error) {
      if (controller.signal.aborted) throw new FileSecurityError("storage_timeout");
      const metadata = typeof error === "object" && error !== null && "$metadata" in error
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata : undefined;
      if (metadata?.httpStatusCode === 404) throw new FileSecurityError("not_found");
      if (metadata?.httpStatusCode === 412) throw new FileSecurityError("already_exists");
      throw new FileSecurityError("storage_failure");
    } finally { clearTimeout(timer); }
  }

  async putImmutable(key: string, body: ObjectBody, contentType: string): Promise<{ size: number }> {
    this.assertKey(key);
    let size = 0;
    const counted = Readable.from((async function* () {
      for await (const chunk of body) { size += chunk.byteLength; yield chunk; }
    })());
    await this.execute((abortSignal) => this.client.send(new PutObjectCommand({
      Bucket: this.config.bucket, Key: key, Body: counted, ContentType: contentType, IfNoneMatch: "*",
    }), { abortSignal }).then(() => undefined));
    return { size };
  }

  async get(key: string): Promise<StoredObject> {
    this.assertKey(key);
    const response = await this.execute((abortSignal) => this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }), { abortSignal },
    ));
    if (!response.Body || response.ContentLength === undefined) throw new FileSecurityError("storage_failure");
    return { body: response.Body as ObjectBody, size: response.ContentLength };
  }

  async head(key: string): Promise<{ size: number }> {
    this.assertKey(key);
    const response = await this.execute((abortSignal) => this.client.send(
      new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }), { abortSignal },
    ));
    if (response.ContentLength === undefined) throw new FileSecurityError("storage_failure");
    return { size: response.ContentLength };
  }

  async remove(key: string): Promise<void> {
    this.assertKey(key);
    await this.execute((abortSignal) => this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }), { abortSignal },
    ).then(() => undefined));
  }
}
