-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('BUG', 'IDEA', 'IMPROVEMENT', 'DECISION', 'CHANGELOG');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "typeData" JSONB,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "componentSlug" TEXT,
    "priority" TEXT,
    "status" "NoteStatus" NOT NULL DEFAULT 'OPEN',
    "authorId" TEXT NOT NULL,
    "lastEditedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_type_idx" ON "Note"("type");

-- CreateIndex
CREATE INDEX "Note_status_idx" ON "Note"("status");

-- CreateIndex
CREATE INDEX "Note_authorId_idx" ON "Note"("authorId");

-- CreateIndex
CREATE INDEX "Note_componentSlug_idx" ON "Note"("componentSlug");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Note"
ADD CONSTRAINT "Note_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note"
ADD CONSTRAINT "Note_lastEditedById_fkey"
FOREIGN KEY ("lastEditedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
