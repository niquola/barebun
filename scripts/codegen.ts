import { generate } from "../src/lib/codegen.ts";
import { start, stop } from "../src/system.ts";

const ctx = start();
const args = process.argv.slice(2);

let schema: string | undefined;
const tables: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--schema" && args[i + 1]) {
    schema = args[++i];
  } else if (!args[i].startsWith("-")) {
    tables.push(args[i]);
  }
}

try {
  await generate(ctx, { schema, tables: tables.length ? tables : undefined });
} finally {
  await stop(ctx);
}
