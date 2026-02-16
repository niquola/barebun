#!/usr/bin/env bun
// Run arbitrary SQL against dev or test database.
// Usage:
//   bun scripts/sql.ts "SELECT * FROM users LIMIT 5"
//   bun scripts/sql.ts --test "SELECT * FROM _migrations"
//   echo "SELECT 1" | bun scripts/sql.ts
//   echo "SELECT 1" | bun scripts/sql.ts --test

import { SQL } from "bun";

const args = process.argv.slice(2);
let useTest = false;
const sqlArgs: string[] = [];

for (const arg of args) {
  if (arg === "--test" || arg === "-t") {
    useTest = true;
  } else {
    sqlArgs.push(arg);
  }
}

const database = useTest
  ? (process.env.PGDATABASE || "iglite") + "_test"
  : undefined;

const sql = new SQL(database ? { database } : undefined);

let query: string;

if (sqlArgs.length > 0) {
  query = sqlArgs.join(" ");
} else {
  // Read from stdin
  query = await Bun.stdin.text();
}

query = query.trim();
if (!query) {
  console.log("Usage: bun scripts/sql.ts [--test] \"SQL query\"");
  console.log("       echo \"SQL\" | bun scripts/sql.ts [--test]");
  process.exit(1);
}

try {
  const rows = await sql.unsafe(query);
  if (rows.length === 0) {
    console.log("(0 rows)");
  } else {
    console.table(rows);
  }
} catch (e: any) {
  console.error("Error:", e.message);
  process.exit(1);
} finally {
  await sql.close();
}
