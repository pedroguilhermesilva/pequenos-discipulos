-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'premium', 'family');

-- CreateEnum
CREATE TYPE "AgeTier" AS ENUM ('TIER_3_5', 'TIER_6_8', 'TIER_9_11');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('text', 'audio', 'video');

-- CreateEnum
CREATE TYPE "AdaptationStatus" AS ENUM ('draft', 'family_approved', 'community', 'as_default');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "hasCreatedStory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "sourceText" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassageAdaptation" (
    "id" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "bibleVersionId" TEXT NOT NULL,
    "verseFrom" INTEGER NOT NULL,
    "verseTo" INTEGER NOT NULL,
    "ageTier" "AgeTier" NOT NULL,
    "languageStyle" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "content" JSONB NOT NULL,
    "quiz" JSONB,
    "adaptationNote" TEXT,
    "status" "AdaptationStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "voteScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassageAdaptation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childProfileId" TEXT,
    "adaptationId" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "totalPages" INTEGER NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3),

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdaptationVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adaptationId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdaptationVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioAsset" (
    "id" TEXT NOT NULL,
    "adaptationId" TEXT NOT NULL,
    "blockKey" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "durationMs" INTEGER,

    CONSTRAINT "AudioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "month" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ChildProfile_userId_idx" ON "ChildProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Passage_slug_key" ON "Passage"("slug");

-- CreateIndex
CREATE INDEX "PassageAdaptation_passageId_ageTier_contentType_status_idx" ON "PassageAdaptation"("passageId", "ageTier", "contentType", "status");

-- CreateIndex
CREATE INDEX "PassageAdaptation_status_voteScore_idx" ON "PassageAdaptation"("status", "voteScore");

-- CreateIndex
CREATE UNIQUE INDEX "PassageAdaptation_passageId_bibleVersionId_verseFrom_verseT_key" ON "PassageAdaptation"("passageId", "bibleVersionId", "verseFrom", "verseTo", "ageTier", "languageStyle", "contentType", "version");

-- CreateIndex
CREATE INDEX "UserStory_userId_isFavorite_idx" ON "UserStory"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "UserStory_childProfileId_idx" ON "UserStory"("childProfileId");

-- CreateIndex
CREATE INDEX "UserStory_adaptationId_idx" ON "UserStory"("adaptationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_userStoryId_key" ON "ReadingProgress"("userStoryId");

-- CreateIndex
CREATE INDEX "Collection_userId_childProfileId_idx" ON "Collection"("userId", "childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_collectionId_position_key" ON "CollectionItem"("collectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AdaptationVote_userId_adaptationId_key" ON "AdaptationVote"("userId", "adaptationId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioAsset_adaptationId_blockKey_key" ON "AudioAsset"("adaptationId", "blockKey");

-- CreateIndex
CREATE UNIQUE INDEX "UsageEvent_userId_contentType_month_key" ON "UsageEvent"("userId", "contentType", "month");

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassageAdaptation" ADD CONSTRAINT "PassageAdaptation_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "PassageAdaptation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "UserStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "UserStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdaptationVote" ADD CONSTRAINT "AdaptationVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdaptationVote" ADD CONSTRAINT "AdaptationVote_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "PassageAdaptation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "PassageAdaptation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
