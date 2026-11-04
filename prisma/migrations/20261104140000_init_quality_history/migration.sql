-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "pending" INTEGER NOT NULL,
    "passedPercentage" DOUBLE PRECISION,
    "coverageLines" DOUBLE PRECISION,
    "coverageStmts" DOUBLE PRECISION,
    "coverageFns" DOUBLE PRECISION,
    "coverageBranches" DOUBLE PRECISION,
    "durationMs" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestFailure" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "messages" TEXT[],

    CONSTRAINT "TestFailure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentTestResult" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT,
    "componentSlug" TEXT NOT NULL,
    "componentName" TEXT,
    "scope" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "pending" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComponentTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentTestCase" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ComponentTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestRun_completedAt_idx" ON "TestRun"("completedAt" DESC);

-- CreateIndex
CREATE INDEX "TestFailure_testRunId_idx" ON "TestFailure"("testRunId");

-- CreateIndex
CREATE INDEX "ComponentTestResult_componentSlug_completedAt_idx" ON "ComponentTestResult"("componentSlug", "completedAt" DESC);

-- CreateIndex
CREATE INDEX "ComponentTestResult_testRunId_idx" ON "ComponentTestResult"("testRunId");

-- CreateIndex
CREATE INDEX "ComponentTestCase_resultId_idx" ON "ComponentTestCase"("resultId");

-- AddForeignKey
ALTER TABLE "TestFailure" ADD CONSTRAINT "TestFailure_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentTestResult" ADD CONSTRAINT "ComponentTestResult_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentTestCase" ADD CONSTRAINT "ComponentTestCase_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ComponentTestResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
