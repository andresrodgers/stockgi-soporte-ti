/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

async function main() {
  const connectionString = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("MIGRATION_DATABASE_URL o DATABASE_URL requerido");
  const client = new Client({ connectionString });
  await client.connect();
  const dir = path.join(process.cwd(), "database", "seeds", "demo");
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    console.log(`Running demo seed ${file}`);
    await client.query(sql);
  }
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});