-- Auth.js PrismaAdapter expects User.name (OAuth profile display name).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Keep existing display names reachable from either field.
UPDATE "User"
SET "name" = "fullName"
WHERE "name" IS NULL AND "fullName" IS NOT NULL;
