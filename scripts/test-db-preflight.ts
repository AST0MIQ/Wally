/**
 * Fail-closed runner for the DB integration suite (`pnpm test:db`).
 *
 *  - resolves an ISOLATED test database URL (default: the project's
 *    DATABASE_URL with the db name swapped to `wally_test`; override with
 *    TEST_DATABASE_URL);
 *  - verifies the PostgreSQL server is reachable;
 *  - creates the test database if it is missing;
 *  - applies ALL migrations (`prisma migrate deploy`);
 *  - runs Vitest with `DB_TESTS_REQUIRED=1` so a DB integration suite can
 *    never be skipped or reported as passing;
 *  - exits non-zero on ANY failure.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function die(msg: string): never {
  console.error(`\n[test:db] ${msg}\n`);
  process.exit(1);
}

function envFromDotenv(key: string): string | undefined {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)\\s*$`));
      if (m?.[1]) return m[1].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env */
  }
  return undefined;
}

const base =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  envFromDotenv("DATABASE_URL");
if (!base) die("no DATABASE_URL / TEST_DATABASE_URL to derive a test database from");

const src = new URL(base);
if (!process.env.TEST_DATABASE_URL) {
  src.pathname = "/wally_test";
}
const TEST_URL = src.toString();
const dbName = new URL(TEST_URL).pathname.replace(/^\//, "").split("?")[0];
if (!dbName || dbName === "postgres") die(`refusing "${dbName}" as the test database`);

const admin = new URL(TEST_URL);
admin.pathname = "/postgres";
admin.search = "";
const adminUrl = admin.toString();

function psql(url: string, sql: string): string {
  try {
    return execFileSync("psql", [url, "-XtAc", sql], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    die(`psql failed: ${(err as Error).message}. Is PostgreSQL up and psql on PATH?`);
  }
}

if (psql(adminUrl, "SELECT 1") !== "1") die("server did not answer SELECT 1");

const exists =
  psql(adminUrl, `SELECT 1 FROM pg_database WHERE datname = '${dbName.replace(/'/g, "''")}'`) === "1";
if (!exists) {
  console.log(`[test:db] creating database "${dbName}"`);
  psql(adminUrl, `CREATE DATABASE "${dbName}"`);
} else {
  console.log(`[test:db] database "${dbName}" present`);
}

const migrate = spawnSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: TEST_URL, DIRECT_URL: TEST_URL },
});
if (migrate.status !== 0) die("`prisma migrate deploy` failed against the test database");

console.log(`[test:db] schema ready — running the suite with DB_TESTS_REQUIRED=1\n`);

const vitest = spawnSync(
  "pnpm",
  ["exec", "vitest", "run", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_URL,
      DIRECT_URL: TEST_URL,
      DB_TESTS_REQUIRED: "1",
    },
  },
);
process.exit(vitest.status ?? 1);
