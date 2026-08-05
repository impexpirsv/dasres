import {
  mkdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from "fs/promises";
import path from "path";

export interface StorageProvider {
  write(
    storageKey: string,
    bytes: Uint8Array,
  ): Promise<string>;
  read(
    storageKey: string,
  ): Promise<{
    bytes: Buffer;
    size: number;
  }>;
  remove(storageKey: string): Promise<void>;
  resolve(storageKey: string): string;
}

export class LocalStorageProvider
  implements StorageProvider
{
  private readonly rootDirectory: string;

  constructor(rootDirectory: string) {
    this.rootDirectory =
      path.resolve(rootDirectory);
  }

  resolve(storageKey: string): string {
    if (
      !storageKey ||
      path.basename(storageKey) !==
        storageKey
    ) {
      throw new Error(
        "INVALID_STORAGE_KEY",
      );
    }

    const storagePath = path.resolve(
      this.rootDirectory,
      storageKey,
    );

    if (
      path.dirname(storagePath) !==
      this.rootDirectory
    ) {
      throw new Error(
        "INVALID_STORAGE_KEY",
      );
    }

    return storagePath;
  }

  async write(
    storageKey: string,
    bytes: Uint8Array,
  ): Promise<string> {
    const storagePath =
      this.resolve(storageKey);

    await mkdir(this.rootDirectory, {
      recursive: true,
    });
    await writeFile(storagePath, bytes, {
      flag: "wx",
    });

    return storagePath;
  }

  async read(
    storageKey: string,
  ): Promise<{
    bytes: Buffer;
    size: number;
  }> {
    const storagePath =
      this.resolve(storageKey);
    const [bytes, metadata] =
      await Promise.all([
        readFile(storagePath),
        stat(storagePath),
      ]);

    if (!metadata.isFile()) {
      throw new Error(
        "STORAGE_OBJECT_NOT_FOUND",
      );
    }

    return {
      bytes,
      size: metadata.size,
    };
  }

  async remove(
    storageKey: string,
  ): Promise<void> {
    await unlink(
      this.resolve(storageKey),
    );
  }
}
