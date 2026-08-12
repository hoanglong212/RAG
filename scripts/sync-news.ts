import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main(): Promise<void> {
  const [{ sql }, { syncAllNewsSources }] = await Promise.all([
    import("../src/lib/db/client"),
    import("../src/lib/news/sync"),
  ]);
  try {
    const results = await syncAllNewsSources(sql);
    console.table(results);
    if (results.every((result) => result.status === "error")) process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void main();
