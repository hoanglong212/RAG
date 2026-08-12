/** Đồng bộ metadata và quan hệ pháp lý đã kiểm chứng vào Postgres. */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

type RelationType =
  | "sua_doi_bo_sung"
  | "thay_the"
  | "bai_bo"
  | "quy_dinh_chi_tiet"
  | "quy_dinh_xu_phat"
  | "hop_nhat";

interface CatalogDocument {
  docId: string;
  fileName: string;
  soHieu: string;
  title: string;
  topics: string[];
  sourceUrl: string;
  issuedAt: string;
  effectiveFrom: string;
  status: "in_force" | "future";
  requiredForRetrieval?: boolean;
  validityNote?: "in_force" | "partially_expired" | "future";
}

interface CatalogRelation {
  sourceDocId: string;
  targetDocId: string;
  type: RelationType;
  effectiveFrom: string;
}

interface LegalCatalog {
  schemaVersion: 1;
  verifiedAt: string;
  documents: CatalogDocument[];
  relations: CatalogRelation[];
}

async function main(): Promise<void> {
  const catalogPath = resolve(readArg("--catalog") ?? "data/legal-catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as LegalCatalog;
  validateCatalog(catalog);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Thiếu DATABASE_URL.");
  const sql = postgres(databaseUrl, { prepare: !databaseUrl.includes(":6543"), max: 1 });
  const today = new Date().toISOString().slice(0, 10);
  let updated = 0;
  let missing = 0;
  let deferred = 0;
  let related = 0;

  try {
    for (const item of catalog.documents) {
      const retrievalEnabled = item.effectiveFrom <= today;
      const rows = await sql<{ id: string }[]>`
        WITH selected AS (
          SELECT id FROM documents
          WHERE ten_file = ${item.fileName} AND ingest_status = 'hoan_tat'
          ORDER BY created_at DESC
          LIMIT 1
        )
        UPDATE documents d
        SET so_hieu = ${item.soHieu},
            trich_yeu = ${item.title},
            ngay_ban_hanh = ${item.issuedAt},
            ngay_hieu_luc = ${item.effectiveFrom},
            trang_thai = ${retrievalEnabled ? "con_hieu_luc" : "chua_xac_dinh"},
            source_ref = ${`vanban.chinhphu.vn:${item.docId}`},
            source_url = ${item.sourceUrl},
            legal_topics = ${item.topics},
            verified_at = ${catalog.verifiedAt},
            retrieval_enabled = ${retrievalEnabled},
            validity_note = ${item.validityNote ?? item.status}
        FROM selected
        WHERE d.id = selected.id
        RETURNING d.id`;
      if (rows.length === 0) {
        if (item.requiredForRetrieval === false) {
          deferred += 1;
          console.warn(`- Tạm hoãn có chủ đích: ${item.fileName}`);
        } else {
          missing += 1;
          console.warn(`- Chưa ingest: ${item.fileName}`);
        }
      } else {
        updated += 1;
      }
    }

    for (const relation of catalog.relations) {
      const sourceRef = `vanban.chinhphu.vn:${relation.sourceDocId}`;
      const targetRef = `vanban.chinhphu.vn:${relation.targetDocId}`;
      const rows = await sql<{ id: string }[]>`
        INSERT INTO document_relations (
          source_document_id, target_document_id, relation_type,
          effective_from, source_url, verified_at
        )
        SELECT source.id, target.id, ${relation.type}, ${relation.effectiveFrom},
               source.source_url, ${catalog.verifiedAt}
        FROM documents source, documents target
        WHERE source.source_ref = ${sourceRef} AND target.source_ref = ${targetRef}
        ON CONFLICT (source_document_id, target_document_id, relation_type)
        DO UPDATE SET effective_from = EXCLUDED.effective_from,
                      source_url = EXCLUDED.source_url,
                      verified_at = EXCLUDED.verified_at
        RETURNING id`;
      related += rows.length;
    }
  } finally {
    await sql.end();
  }

  console.log(
    `Đã đồng bộ ${updated} văn bản và ${related} quan hệ; thiếu ${missing}, tạm hoãn ${deferred} văn bản.`,
  );
  if (missing > 0) process.exitCode = 2;
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function validateCatalog(value: LegalCatalog): void {
  if (value.schemaVersion !== 1 || !Array.isArray(value.documents) || !Array.isArray(value.relations)) {
    throw new Error("Catalog không đúng schemaVersion 1.");
  }
  const ids = new Set<string>();
  const files = new Set<string>();
  for (const item of value.documents) {
    if (!item.docId || !item.fileName || !item.soHieu || !item.sourceUrl || item.topics.length === 0) {
      throw new Error("Catalog có văn bản thiếu trường bắt buộc.");
    }
    if (ids.has(item.docId) || files.has(item.fileName)) {
      throw new Error(`Catalog trùng docId hoặc fileName: ${item.docId}`);
    }
    ids.add(item.docId);
    files.add(item.fileName);
  }
  for (const relation of value.relations) {
    if (!ids.has(relation.sourceDocId) || !ids.has(relation.targetDocId)) {
      throw new Error(`Quan hệ tham chiếu docId ngoài catalog: ${relation.sourceDocId}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
