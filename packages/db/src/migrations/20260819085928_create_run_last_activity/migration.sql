-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
