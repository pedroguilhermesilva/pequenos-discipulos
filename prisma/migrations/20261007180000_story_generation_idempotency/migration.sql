-- CreateTable
CREATE TABLE "StoryGenerationIdempotency" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "adaptationId" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryGenerationIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryGenerationIdempotency_userId_idempotencyKey_key" ON "StoryGenerationIdempotency"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "StoryGenerationIdempotency_expiresAt_idx" ON "StoryGenerationIdempotency"("expiresAt");

-- AddForeignKey
ALTER TABLE "StoryGenerationIdempotency" ADD CONSTRAINT "StoryGenerationIdempotency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
