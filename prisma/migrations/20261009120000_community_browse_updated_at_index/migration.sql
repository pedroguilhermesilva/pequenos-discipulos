-- Browse community versions sorted by recency (status already indexed with voteScore)
CREATE INDEX "PassageAdaptation_status_updatedAt_idx" ON "PassageAdaptation"("status", "updatedAt" DESC);
