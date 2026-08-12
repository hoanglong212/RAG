/** CLI: data/raw -> extract -> parse -> embed theo lo 50 -> Postgres. */
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";
import { isSupportedDocumentName } from "../src/lib/ingest/extract";

config({ path: ".env.local" });
config({ path: ".env" });

const rawDirectory = resolve("data/raw");

async function main(): Promise<void> {
  const selectedFiles = parseSelectedFiles(process.argv.slice(2));
  const entries = await readdir(rawDirectory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && isSupportedDocumentName(entry.name))
    .map((entry) => entry.name)
    .filter((fileName) => selectedFiles.size === 0 || selectedFiles.has(fileName))
    .sort((a, b) => a.localeCompare(b, "vi"));

  if (files.length === 0) {
    console.log(`Không có PDF, DOCX, TXT hoặc Markdown trong ${rawDirectory}.`);
    return;
  }

  // Import sau khi dotenv da nap, vi db client doc DATABASE_URL ngay luc khoi tao module.
  const [{ createEmbeddingProvider }, { ingestDocument }, { DrizzleIngestStorage }] =
    await Promise.all([
      import("../src/lib/embedding/provider"),
      import("../src/lib/ingest/pipeline"),
      import("../src/lib/ingest/storage"),
    ]);
  const embeddingProvider = await createEmbeddingProvider();
  const storage = new DrizzleIngestStorage();
  let succeeded = 0;
  let failed = 0;

  for (let index = 0; index < files.length; index += 1) {
    const fileName = files[index];
    renderProgress(index, files.length, fileName);
    try {
      const data = await readFile(join(rawDirectory, fileName));
      const result = await ingestDocument(
        { fileName, data },
        { storage, embeddingProvider },
      );
      succeeded += 1;
      console.log(
        `\n✓ ${fileName}: ${result.chunkCount} chunk, ${result.warnings.length + result.extractionWarnings.length} cảnh báo`,
      );
    } catch (error) {
      failed += 1;
      console.error(`\n✗ ${fileName}: ${error instanceof Error ? error.message : error}`);
    }
  }

  renderProgress(files.length, files.length, "hoàn tất");
  console.log(`\nĐã xử lý ${files.length} tệp: ${succeeded} thành công, ${failed} lỗi.`);
  await storage.close();
  if (failed > 0) process.exitCode = 1;
}

function parseSelectedFiles(args: string[]): Set<string> {
  const selected = new Set<string>();
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== "--file") continue;
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error("Thiếu tên tệp sau --file.");
    selected.add(value);
    index += 1;
  }
  return selected;
}

function renderProgress(done: number, total: number, label: string): void {
  const width = 24;
  const filled = total === 0 ? width : Math.round((done / total) * width);
  const bar = `${"#".repeat(filled)}${"-".repeat(width - filled)}`;
  process.stdout.write(`\r[${bar}] ${done}/${total} ${label}`);
}

main().catch((error: unknown) => {
  console.error(`\n✗ Không thể chạy ingest: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
