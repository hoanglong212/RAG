/**
 * Thu thap van ban toan van tu Cong Thong tin dien tu Chinh phu.
 *
 * Du lieu tho duoc ghi vao data/raw (gitignored). Manifest co URL va SHA-256
 * duoc commit de bo du lieu co the duoc tai lai va kiem chung.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseVanBan } from "../src/lib/parser";

const PORTAL_ORIGIN = "https://vanban.chinhphu.vn";
const DEFAULT_QUERY = "an toàn thực phẩm";
const DEFAULT_LIMIT = 60;
const MIN_DOCUMENT_LENGTH = 800;

interface CollectedDocument {
  docId: string;
  title: string;
  sourceUrl: string;
  fileName: string;
  sha256: string;
  characterCount: number;
  structuralChunkCount: number;
  collectedAt: string;
}

interface CollectionManifest {
  schemaVersion: 1;
  collection: string;
  query: string;
  source: string;
  requestedLimit: number;
  requireStructural: boolean;
  collectedAt: string;
  documents: CollectedDocument[];
  skipped: Array<{ docId: string; reason: string }>;
}

interface CliOptions {
  query: string;
  limit: number;
  rawDirectory: string;
  manifestPath: string;
  requireStructural: boolean;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const discoveredIds = await discoverDocumentIds(options.query);
  if (discoveredIds.length === 0) {
    throw new Error(`Không tìm thấy văn bản nào cho từ khóa "${options.query}".`);
  }

  await mkdir(options.rawDirectory, { recursive: true });
  const collectedAt = new Date().toISOString();
  const documents: CollectedDocument[] = [];
  const skipped: Array<{ docId: string; reason: string }> = [];

  for (const docId of discoveredIds) {
    if (documents.length >= options.limit) break;
    try {
      const sourceUrl = `${PORTAL_ORIGIN}/default.aspx?pageid=27160&docid=${docId}`;
      const html = await fetchText(sourceUrl);
      const title = extractTitle(html);
      const text = extractFullText(html);
      if (text.length < MIN_DOCUMENT_LENGTH) {
        skipped.push({ docId, reason: `Toàn văn chỉ có ${text.length} ký tự.` });
        continue;
      }

      const fileName = `${docId}-${slugify(title).slice(0, 80) || "van-ban"}.txt`;
      const body = `${title}\n\n${text.trim()}\n`.normalize("NFC");
      const structuralChunkCount = parseVanBan(body, { tenFile: fileName }).chunks.length;
      if (options.requireStructural && structuralChunkCount === 0) {
        skipped.push({ docId, reason: "Parser không tạo được structural chunk." });
        continue;
      }
      await writeFile(resolve(options.rawDirectory, fileName), body, "utf8");
      documents.push({
        docId,
        title,
        sourceUrl,
        fileName,
        sha256: createHash("sha256").update(body, "utf8").digest("hex"),
        characterCount: body.length,
        structuralChunkCount,
        collectedAt,
      });
      process.stdout.write(`\rĐã tải ${documents.length}/${options.limit}: ${docId}`);
      await delay(150);
    } catch (error) {
      skipped.push({ docId, reason: safeMessage(error) });
    }
  }

  const manifest: CollectionManifest = {
    schemaVersion: 1,
    collection: "vietnamese-food-safety-law",
    query: options.query,
    source: PORTAL_ORIGIN,
    requestedLimit: options.limit,
    requireStructural: options.requireStructural,
    collectedAt,
    documents,
    skipped,
  };
  await writeFile(options.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write("\n");
  console.log(
    `Đã lưu ${documents.length} văn bản; bỏ qua ${skipped.length}. Manifest: ${options.manifestPath}`,
  );
  if (documents.length < options.limit) {
    throw new Error(
      `Chỉ thu thập được ${documents.length}/${options.limit} văn bản toàn văn từ ${discoveredIds.length} kết quả.`,
    );
  }
}

async function discoverDocumentIds(query: string): Promise<string[]> {
  const ids = new Set<string>();
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 1990; year -= 1) {
    const yearIds = await searchDocumentIds(query, year);
    yearIds.forEach((id) => ids.add(id));
    process.stdout.write(`\rĐã tìm thấy ${ids.size} mã văn bản đến năm ${year}`);
  }
  process.stdout.write("\n");
  return [...ids];
}

async function searchDocumentIds(query: string, year: number): Promise<string[]> {
  const response = await fetch(`${PORTAL_ORIGIN}/`, {
    headers: { "user-agent": userAgent() },
  });
  if (!response.ok) throw new Error(`Trang danh mục trả HTTP ${response.status}.`);
  const html = await response.text();
  const form = extractHiddenInputs(html);
  form.set("ctrl_191017_163$drdDocCategory", "0");
  form.set("ctrl_191017_163$drdDocOrg", "0");
  form.set("ctrl_191017_163$drdDocYear", String(year));
  form.set("ctrl_191017_163$txtSearchKeyword", query);
  form.set("ctrl_191017_163$drdRecordPerPage", "500");
  form.set("ctrl_191017_163$btnSearch", "Tìm kiếm");

  const searchResponse = await fetch(`${PORTAL_ORIGIN}/`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": userAgent(),
    },
    body: form,
  });
  if (!searchResponse.ok) {
    throw new Error(`Tìm kiếm văn bản trả HTTP ${searchResponse.status}.`);
  }
  const resultHtml = await searchResponse.text();
  const gridStart = resultHtml.indexOf('id="ctrl_191017_163_grvDocument"');
  const gridEnd = resultHtml.indexOf("</table>", gridStart);
  const grid = gridStart >= 0 ? resultHtml.slice(gridStart, gridEnd) : resultHtml;
  const ids = [...grid.matchAll(/[?&]docid=(\d+)/gi)].map((match) => match[1]);
  return [...new Set(ids)];
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": userAgent() } });
  if (!response.ok) throw new Error(`HTTP ${response.status} khi tải ${url}.`);
  return response.text();
}

function extractHiddenInputs(html: string): URLSearchParams {
  const params = new URLSearchParams();
  for (const match of html.matchAll(/<input\b[^>]*type=["']hidden["'][^>]*>/gi)) {
    const name = attribute(match[0], "name");
    if (!name) continue;
    params.set(decodeHtml(name), decodeHtml(attribute(match[0], "value") ?? ""));
  }
  return params;
}

function extractTitle(html: string): string {
  const match = html.match(/<span\b[^>]*id=["'][^"']*_lb_noidung["'][^>]*>([\s\S]*?)<\/span>/i);
  if (!match) throw new Error("Không đọc được tiêu đề văn bản.");
  return htmlToText(match[1]).replace(/\s+/g, " ").trim();
}

function extractFullText(html: string): string {
  const startMarker = 'id="block_detail"';
  const start = html.indexOf(startMarker);
  if (start < 0) throw new Error("Trang không có khối toàn văn.");
  const end = html.indexOf('class="Content"', start);
  const fragment = html.slice(start + startMarker.length, end >= 0 ? end : undefined);
  return htmlToText(fragment)
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .normalize("NFC");
}

function htmlToText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:p|div|h[1-6]|li|tr|td|table)>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, " "),
  );
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return named[code.toLowerCase()] ?? entity;
  });
}

function attribute(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1];
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseOptions(args: string[]): CliOptions {
  let query = DEFAULT_QUERY;
  let limit = DEFAULT_LIMIT;
  let rawDirectory = resolve("data/raw");
  let manifestPath = resolve("data/manifest-food-safety.json");
  let requireStructural = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index + 1];
    if (args[index] === "--query" && value) query = value;
    if (args[index] === "--limit" && value) limit = Number.parseInt(value, 10);
    if (args[index] === "--raw-directory" && value) rawDirectory = resolve(value);
    if (args[index] === "--manifest" && value) manifestPath = resolve(value);
    if (args[index] === "--require-structural") requireStructural = true;
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error("--limit phải là số nguyên từ 1 đến 500.");
  }
  return { query, limit, rawDirectory, manifestPath, requireStructural };
}

function userAgent(): string {
  return "RAG-VanBan-Collector/1.0 (educational corpus; source URLs preserved)";
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function safeMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Lỗi không xác định.";
}

main().catch((error: unknown) => {
  console.error(`✗ ${safeMessage(error)}`);
  process.exit(1);
});
