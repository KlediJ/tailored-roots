#!/usr/bin/env node
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const defaultSqliteUrl = "file:./dev.db";
const dbUrl = process.env.DATABASE_URL || defaultSqliteUrl;
const isSqlite = dbUrl.startsWith("file:");
const schemaPath = isSqlite ? "prisma/schema.sqlite.prisma" : "prisma/schema.prisma";
const resolved = path.join(process.cwd(), schemaPath);

if (!fs.existsSync(resolved)) {
  console.error(`[prisma] Schema not found at ${schemaPath}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.warn("[prisma] DATABASE_URL not set; defaulting to sqlite dev database");
}

console.log(
  `[prisma] Generating client using ${schemaPath} (${isSqlite ? "sqlite" : "postgres"} mode)`,
);

execSync(`npx prisma generate --schema ${schemaPath}`, {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: dbUrl },
});
