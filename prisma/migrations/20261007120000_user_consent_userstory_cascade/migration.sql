-- AlterTable: LGPD consent fields on User
ALTER TABLE "User" ADD COLUMN "consentAcceptedAt" TIMESTAMP(3),
ADD COLUMN "consentVersion" TEXT;

-- Fix UserStory cascade: delete stories when child profile or adaptation is removed
ALTER TABLE "UserStory" DROP CONSTRAINT "UserStory_childProfileId_fkey";
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserStory" DROP CONSTRAINT "UserStory_adaptationId_fkey";
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "PassageAdaptation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
