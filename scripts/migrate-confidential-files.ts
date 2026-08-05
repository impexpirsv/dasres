import { constants } from "fs";
import { copyFile, mkdir, readdir, stat, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { prisma } from "../lib/prisma";

type ConfidentialKind = "cases" | "project-task-attachments";

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function legacyFileName(storageKey: string, kind: ConfidentialKind): string {
  const prefix = `/uploads/${kind}/`;
  const candidate = storageKey.startsWith(prefix)
    ? decodeURIComponent(storageKey.slice(prefix.length))
    : storageKey;
  if (!candidate || path.basename(candidate) !== candidate || candidate.includes("..")) {
    throw new Error(`Unsafe legacy storage key for ${kind}`);
  }
  return candidate;
}

async function copyToPrivate(kind: ConfidentialKind, currentKey: string): Promise<{
  storageKey: string;
  mimeType: string;
  fileSize: number;
  sourcePath: string;
}> {
  const fileName = legacyFileName(currentKey, kind);
  const sourcePath = path.join(process.cwd(), "public", "uploads", kind, fileName);
  const extension = path.extname(fileName).toLowerCase();
  const mimeType = MIME_BY_EXTENSION[extension];
  if (!mimeType) throw new Error(`Unsupported legacy file extension for ${kind}`);

  const storageKey = `${randomUUID()}${extension}`;
  const privateDirectory = path.join(process.cwd(), "storage", "private", kind);
  const destinationPath = path.join(privateDirectory, storageKey);
  await mkdir(privateDirectory, { recursive: true });
  await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL);
  const metadata = await stat(destinationPath);
  return { storageKey, mimeType, fileSize: metadata.size, sourcePath };
}

async function migrateRecords(): Promise<void> {
  const caseDocuments = await prisma.caseDocument.findMany({
    select: { id: true, storageKey: true },
  });
  for (const document of caseDocuments) {
    if (/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(document.storageKey)) continue;
    const moved = await copyToPrivate("cases", document.storageKey);
    await prisma.caseDocument.update({
      where: { id: document.id },
      data: { storageKey: moved.storageKey, mimeType: moved.mimeType, fileSize: moved.fileSize },
    });
    await unlink(moved.sourcePath);
  }

  const attachments = await prisma.projectTaskAttachment.findMany({
    select: { id: true, storageKey: true },
  });
  for (const attachment of attachments) {
    if (/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(attachment.storageKey)) continue;
    const moved = await copyToPrivate("project-task-attachments", attachment.storageKey);
    await prisma.projectTaskAttachment.update({
      where: { id: attachment.id },
      data: { storageKey: moved.storageKey, mimeType: moved.mimeType, fileSize: moved.fileSize },
    });
    await unlink(moved.sourcePath);
  }
}

async function quarantineUnreferencedFiles(kind: ConfidentialKind): Promise<void> {
  const publicDirectory = path.join(process.cwd(), "public", "uploads", kind);
  const quarantineDirectory = path.join(process.cwd(), "storage", "private", "legacy-orphans", kind);
  let files: string[];
  try {
    files = await readdir(publicDirectory);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
  await mkdir(quarantineDirectory, { recursive: true });
  for (const fileName of files) {
    if (path.basename(fileName) !== fileName) throw new Error("Unsafe public upload filename");
    const sourcePath = path.join(publicDirectory, fileName);
    const metadata = await stat(sourcePath);
    if (!metadata.isFile()) throw new Error(`Unexpected directory in ${publicDirectory}`);
    const destinationPath = path.join(quarantineDirectory, `${randomUUID()}${path.extname(fileName).toLowerCase()}`);
    await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL);
    await unlink(sourcePath);
  }
}

async function main(): Promise<void> {
  await migrateRecords();
  await quarantineUnreferencedFiles("cases");
  await quarantineUnreferencedFiles("project-task-attachments");
}

main()
  .catch((error: unknown) => {
    process.exitCode = 1;
    console.error(error instanceof Error ? error.message : "Confidential file migration failed");
  })
  .finally(async () => prisma.$disconnect());
