/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs/promises");
const path = require("node:path");
const { Client } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL requerido");
  const root = process.env.UPLOAD_STORAGE_PATH || path.join(process.cwd(), ".stockgi-uploads");
  const client = new Client({ connectionString });
  await client.connect();
  const { rows } = await client.query("select id, storage_path from ticket_attachments where deleted_at is null and delete_after_at is not null and delete_after_at <= now()");
  for (const row of rows) {
    const absolutePath = path.join(root, row.storage_path);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      if (error && error.code !== "ENOENT") throw error;
    }
    await client.query("update ticket_attachments set deleted_at = now() where id = $1", [row.id]);
    console.log(`Deleted expired attachment ${row.id}`);
  }
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
