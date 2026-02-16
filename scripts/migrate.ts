import { generate, up, down, status } from "../src/lib/migrations.ts";
import { start, stop } from "../src/system.ts";

const ctx = start();
const [command, ...args] = process.argv.slice(2);

try {
  switch (command) {
    case "generate": {
      const name = args.find((a) => !a.startsWith("-"));
      if (!name) {
        console.error("Usage: bun scripts/migrate.ts generate <name> [--ts]");
        process.exit(1);
      }
      const ts = args.includes("--ts");
      await generate(name, ts);
      break;
    }
    case "up":
      await up(ctx);
      break;
    case "down":
      await down(ctx);
      break;
    case "status":
      await status(ctx);
      break;
    default:
      console.error(
        "Usage: bun scripts/migrate.ts <generate|up|down|status>",
      );
      process.exit(1);
  }
} finally {
  await stop(ctx);
}
