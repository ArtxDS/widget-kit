-- Keep standalone component runs and discard historical full-suite rows.
DELETE FROM "ComponentTestResult"
WHERE "scope" <> 'component' OR "testRunId" IS NOT NULL;

UPDATE "ComponentTestResult"
SET "componentName" = "componentSlug"
WHERE "componentName" IS NULL;

-- Remove suite relations and fields from the per-item results.
ALTER TABLE "ComponentTestResult"
  DROP CONSTRAINT "ComponentTestResult_testRunId_fkey";
DROP INDEX "ComponentTestResult_componentSlug_completedAt_idx";
DROP INDEX "ComponentTestResult_testRunId_idx";
ALTER TABLE "ComponentTestResult"
  DROP COLUMN "testRunId",
  DROP COLUMN "scope";

ALTER TABLE "ComponentTestResult" RENAME TO "ItemTestRun";
ALTER TABLE "ItemTestRun" RENAME COLUMN "componentSlug" TO "itemSlug";
ALTER TABLE "ItemTestRun" RENAME COLUMN "componentName" TO "itemName";
ALTER TABLE "ItemTestRun" RENAME CONSTRAINT "ComponentTestResult_pkey" TO "ItemTestRun_pkey";
ALTER TABLE "ItemTestRun" ALTER COLUMN "itemName" SET NOT NULL;
ALTER TABLE "ItemTestRun"
  ADD COLUMN "itemType" TEXT NOT NULL DEFAULT 'component';
ALTER TABLE "ItemTestRun" ALTER COLUMN "itemType" DROP DEFAULT;

-- Rename assertion records and point them at the generic per-item run.
ALTER TABLE "ComponentTestCase"
  DROP CONSTRAINT "ComponentTestCase_resultId_fkey";
DROP INDEX "ComponentTestCase_resultId_idx";
ALTER TABLE "ComponentTestCase" RENAME TO "ItemTestCase";
ALTER TABLE "ItemTestCase" RENAME COLUMN "resultId" TO "itemTestRunId";
ALTER TABLE "ItemTestCase" RENAME CONSTRAINT "ComponentTestCase_pkey" TO "ItemTestCase_pkey";
ALTER TABLE "ItemTestCase"
  ADD CONSTRAINT "ItemTestCase_itemTestRunId_fkey"
  FOREIGN KEY ("itemTestRunId") REFERENCES "ItemTestRun"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ItemTestRun_itemType_itemSlug_completedAt_idx"
  ON "ItemTestRun"("itemType", "itemSlug", "completedAt" DESC);
CREATE INDEX "ItemTestRun_completedAt_idx"
  ON "ItemTestRun"("completedAt" DESC);
CREATE INDEX "ItemTestCase_itemTestRunId_idx"
  ON "ItemTestCase"("itemTestRunId");

-- The application uses its server-side PostgreSQL connection, not the Data API.
ALTER TABLE "ItemTestRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemTestCase" ENABLE ROW LEVEL SECURITY;

-- Full-suite records are no longer part of this quality history.
DROP TABLE "TestFailure";
DROP TABLE "TestRun";
