-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "notes" TEXT,
    "previewUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedStart" DATETIME,
    "requestedEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Booking" ("createdAt", "id", "name", "notes", "phone", "previewUrl", "requestedEnd", "requestedStart", "status", "updatedAt") SELECT "createdAt", "id", "name", "notes", "phone", "previewUrl", "requestedEnd", "requestedStart", "status", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

