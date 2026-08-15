CREATE TYPE "IdentityTokenPurpose" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'EMAIL_CHANGE');

CREATE TABLE "IdentityToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "purpose" "IdentityTokenPurpose" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "targetEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "IdentityToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdentityToken_tokenHash_key" ON "IdentityToken"("tokenHash");
CREATE INDEX "IdentityToken_userId_idx" ON "IdentityToken"("userId");
CREATE INDEX "IdentityToken_purpose_idx" ON "IdentityToken"("purpose");
CREATE INDEX "IdentityToken_expiresAt_idx" ON "IdentityToken"("expiresAt");
CREATE INDEX "IdentityToken_userId_purpose_idx" ON "IdentityToken"("userId", "purpose");

ALTER TABLE "IdentityToken" ADD CONSTRAINT "IdentityToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
