import "server-only";

import { getTransactionalEmailConfig } from "../email/transactional-email-config";
import { env } from "../env";
import { prisma } from "../prisma";
import { getClamAvConfig } from "../security/clamav-upload-scanner";
import { getTrustedProxyConfig } from "../security/trusted-client-ip";
import { getObjectStorageConfig } from "../storage/object-storage-config";

const READINESS_TIMEOUT_MS = 2_000;

export type ReadinessDependencies = Readonly<{
  validateConfiguration: () => void;
  checkDatabase: () => Promise<void>;
  timeoutMs?: number;
}>;

export function validateProductionConfiguration(): void {
  if (!env.IS_PRODUCTION) return;
  getTrustedProxyConfig();
  getTransactionalEmailConfig();
  getObjectStorageConfig();
  getClamAvConfig();
}

async function checkDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

export async function isApplicationReady(
  dependencies: ReadinessDependencies = {
    validateConfiguration: validateProductionConfiguration,
    checkDatabase,
  },
): Promise<boolean> {
  try {
    dependencies.validateConfiguration();
    const timeoutMs = dependencies.timeoutMs ?? READINESS_TIMEOUT_MS;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        dependencies.checkDatabase(),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => reject(new Error("readiness timeout")), timeoutMs);
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
    return true;
  } catch {
    return false;
  }
}
