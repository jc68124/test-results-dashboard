-- CreateTable
CREATE TABLE "SpecTestTitlePart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "specTestId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "SpecTestTitlePart_specTestId_fkey" FOREIGN KEY ("specTestId") REFERENCES "SpecTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing data from SpecTest.title to SpecTestTitlePart
INSERT INTO "SpecTestTitlePart" ("specTestId", "position", "value")
SELECT "id", 0, "title"
FROM "SpecTest";

-- Remove the old column without recreating the table
ALTER TABLE "SpecTest" DROP COLUMN "title";

-- CreateIndex
CREATE INDEX "SpecTestTitlePart_position_value_idx" ON "SpecTestTitlePart"("position", "value");

-- CreateIndex
CREATE INDEX "SpecTestTitlePart_value_idx" ON "SpecTestTitlePart"("value");

-- CreateIndex
CREATE UNIQUE INDEX "SpecTestTitlePart_specTestId_position_key" ON "SpecTestTitlePart"("specTestId", "position");
