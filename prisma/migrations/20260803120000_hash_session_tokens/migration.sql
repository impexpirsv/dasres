-- Existing session rows contain raw bearer tokens and cannot be retained.
-- Invalidating them explicitly prevents incompatible secrets from surviving
-- the migration; users with an active session must authenticate again.
BEGIN;

DELETE FROM "Session";

-- Rename the now-empty column so all future values are explicitly hashes.
ALTER TABLE "Session" RENAME COLUMN "token" TO "tokenHash";

-- Keep the uniqueness invariant while making the index purpose explicit.
ALTER INDEX "Session_token_key" RENAME TO "Session_tokenHash_key";

COMMIT;
