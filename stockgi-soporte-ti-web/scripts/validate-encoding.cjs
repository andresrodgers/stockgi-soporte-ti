/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const ignoredDirs = new Set([".git", ".next", "node_modules", "backup", "uploads"]);
const extensions = new Set([".ts", ".tsx", ".js", ".cjs", ".json", ".md", ".sql", ".css", ".csv", ".toml", ".example", ""]);
const mojibake = [String.fromCharCode(0x00c3), String.fromCharCode(0x00c2), String.fromCharCode(0xfffd)];
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name));
      continue;
    }
    const file = path.join(dir, entry.name);
    const ext = path.extname(entry.name);
    if (!extensions.has(ext)) continue;
    const buffer = fs.readFileSync(file);
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      failures.push(`${path.relative(root, file)}: UTF-8 con BOM`);
      continue;
    }
    const text = buffer.toString("utf8");
    const found = mojibake.find((token) => text.includes(token));
    if (found) failures.push(`${path.relative(root, file)}: posible mojibake`);
  }
}

walk(root);

if (failures.length) {
  console.error("Validación de encoding falló:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Encoding OK: UTF-8 sin BOM y sin mojibake conocido.");