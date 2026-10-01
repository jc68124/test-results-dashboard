-- AlterTable
ALTER TABLE "Run" ADD COLUMN "branch" TEXT;
ALTER TABLE "Run" ADD COLUMN "commitMessage" TEXT;
ALTER TABLE "Run" ADD COLUMN "commitSha" TEXT;
ALTER TABLE "Run" ADD COLUMN "environment" TEXT;
ALTER TABLE "Run" ADD COLUMN "group" TEXT;
ALTER TABLE "Run" ADD COLUMN "machineId" TEXT;
ALTER TABLE "Run" ADD COLUMN "name" TEXT;
ALTER TABLE "Run" ADD COLUMN "parallel" BOOLEAN;
ALTER TABLE "Run" ADD COLUMN "shardId" TEXT;

-- CreateTable
CREATE TABLE "RunAttribute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "runId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "showOnRunList" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    CONSTRAINT "RunAttribute_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RunAttribute_runId_showOnRunList_idx" ON "RunAttribute"("runId", "showOnRunList");

-- CreateIndex
CREATE INDEX "RunAttribute_key_value_runId_idx" ON "RunAttribute"("key", "value", "runId");

-- CreateIndex
CREATE UNIQUE INDEX "RunAttribute_runId_key_key" ON "RunAttribute"("runId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "RunAttribute_runId_position_key" ON "RunAttribute"("runId", "position");
