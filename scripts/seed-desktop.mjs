// Copies the developer's own collected history (collector/data) into the packaged
// Painel Órbita app's per-user data directory, so a local build opens with real data.
// A fresh install starts empty by design; this is a developer convenience, not part
// of the shipped app. Quit Painel Órbita first — the collector must not be writing to
// these files while they are replaced.
//
//   npm run seed:desktop

import { cpSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const source = join(process.cwd(), "collector", "data");
if (!existsSync(source)) {
  console.error(`no source data at ${source}`);
  process.exit(1);
}

// The per-user data directory Electron resolves for app.getPath("userData")/data,
// by platform. Packaged builds use productName "Painel Orbita" (ASCII).
function appDataDir() {
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "Painel Orbita", "data");
  }
  if (process.platform === "win32") {
    const roaming = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(roaming, "Painel Orbita", "data");
  }
  const config = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(config, "Painel Orbita", "data");
}

const dest = appDataDir();
mkdirSync(dest, { recursive: true });

const files = readdirSync(source).filter(
  (name) => name.endsWith(".ndjson") || name.endsWith(".json"),
);
for (const name of files) cpSync(join(source, name), join(dest, name));

console.log(`seeded ${files.length} file(s) into ${dest}`);
