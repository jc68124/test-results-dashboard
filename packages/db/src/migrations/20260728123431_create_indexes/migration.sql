-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IngestKey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "publicId" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IngestKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IngestKey" ("createdAt", "expiresAt", "id", "keyHash", "lastUsedAt", "name", "prefix", "projectId", "publicId", "revokedAt", "updatedAt") SELECT "createdAt", "expiresAt", "id", "keyHash", "lastUsedAt", "name", "prefix", "projectId", "publicId", "revokedAt", "updatedAt" FROM "IngestKey";
DROP TABLE "IngestKey";
ALTER TABLE "new_IngestKey" RENAME TO "IngestKey";
CREATE UNIQUE INDEX "IngestKey_publicId_key" ON "IngestKey"("publicId");
CREATE UNIQUE INDEX "IngestKey_keyHash_key" ON "IngestKey"("keyHash");
CREATE UNIQUE INDEX "IngestKey_projectId_name_key" ON "IngestKey"("projectId", "name");
CREATE TABLE "new_Run" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "publicId" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "framework" TEXT NOT NULL,
    "frameworkVersion" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "browserVersion" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Run_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Run" ("browser", "browserVersion", "createdAt", "endedAt", "framework", "frameworkVersion", "id", "os", "projectId", "publicId", "startedAt", "status", "updatedAt") SELECT "browser", "browserVersion", "createdAt", "endedAt", "framework", "frameworkVersion", "id", "os", "projectId", "publicId", "startedAt", "status", "updatedAt" FROM "Run";
DROP TABLE "Run";
ALTER TABLE "new_Run" RENAME TO "Run";
CREATE UNIQUE INDEX "Run_publicId_key" ON "Run"("publicId");
CREATE INDEX "Run_projectId_startedAt_idx" ON "Run"("projectId", "startedAt");
CREATE INDEX "Run_projectId_status_idx" ON "Run"("projectId", "status");
CREATE TABLE "new_Spec" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "runId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "tests" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "pending" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "message" TEXT,
    CONSTRAINT "Spec_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Spec" ("duration", "endedAt", "failed", "filename", "id", "message", "passed", "pending", "runId", "skipped", "startedAt", "status", "tests") SELECT "duration", "endedAt", "failed", "filename", "id", "message", "passed", "pending", "runId", "skipped", "startedAt", coalesce("status", 'running') AS "status", "tests" FROM "Spec";
DROP TABLE "Spec";
ALTER TABLE "new_Spec" RENAME TO "Spec";
CREATE UNIQUE INDEX "Spec_runId_filename_key" ON "Spec"("runId", "filename");
CREATE TABLE "new_SpecTest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "specId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "message" TEXT,
    "trace" TEXT,
    CONSTRAINT "SpecTest_specId_fkey" FOREIGN KEY ("specId") REFERENCES "Spec" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SpecTest" ("duration", "id", "message", "specId", "status", "title", "trace") SELECT "duration", "id", "message", "specId", "status", "title", "trace" FROM "SpecTest";
DROP TABLE "SpecTest";
ALTER TABLE "new_SpecTest" RENAME TO "SpecTest";
CREATE INDEX "SpecTest_specId_idx" ON "SpecTest"("specId");
CREATE TABLE "new_SpecTestAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "specTestId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "trace" TEXT,
    CONSTRAINT "SpecTestAttempt_specTestId_fkey" FOREIGN KEY ("specTestId") REFERENCES "SpecTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SpecTestAttempt" ("id", "message", "specTestId", "status", "trace") SELECT "id", "message", "specTestId", "status", "trace" FROM "SpecTestAttempt";
DROP TABLE "SpecTestAttempt";
ALTER TABLE "new_SpecTestAttempt" RENAME TO "SpecTestAttempt";
CREATE INDEX "SpecTestAttempt_specTestId_idx" ON "SpecTestAttempt"("specTestId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
