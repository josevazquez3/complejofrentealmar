import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const rmOpts = { recursive: true, force: true, maxRetries: 8, retryDelay: 150 };

for (const name of [".next", join("node_modules", ".cache")]) {
  const p = join(root, name);
  if (existsSync(p)) {
    rmSync(p, rmOpts);
    console.log("Removed:", name);
  }
}
