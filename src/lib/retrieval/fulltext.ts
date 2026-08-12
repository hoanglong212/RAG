import type postgres from "postgres";
import type { ChunkStrategy } from "../db/schema";
import type { RetrievalResult } from "./vector";

interface FulltextRow {
  chunk_id: string;
  document_id: string;
  node_id: string | null;
  so_hieu: string | null;
  breadcrumb: string;
  content: string;
  score: number;
}

const STOP_WORDS = new Set([
  "bao", "bang", "cac", "cho", "cua", "duoc", "gi", "la", "muc", "nhieu",
  "nhung", "quy", "the", "theo", "thi", "toi", "trong", "ve", "va",
]);

/** Tạo OR-query an toàn; số hiệu được xử lý thêm bằng exact match ở SQL. */
export function buildTsQuery(question: string): string {
  const terms = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, (value) => (value === "đ" ? "d" : "D"))
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((term) => term.length >= 2 && !STOP_WORDS.has(term));
  return [...new Set(terms ?? [])].map((term) => `${term}:*`).join(" | ");
}

export function extractLegalIdentifier(question: string): string | null {
  return question.match(/\b\d{1,4}\/\d{4}\/[A-ZĐ0-9]+(?:-[A-ZĐ0-9]+)*\b/i)?.[0] ?? null;
}

/** Full-text tiếng Việt dùng simple + f_unaccent, cộng boost cho số hiệu chính xác. */
export async function fulltextSearch(
  question: string,
  options: { topK: number; strategy: ChunkStrategy },
  sql: postgres.Sql,
): Promise<RetrievalResult[]> {
  const tsQuery = buildTsQuery(question);
  const legalIdentifier = extractLegalIdentifier(question);
  if (tsQuery === "" && legalIdentifier === null) return [];

  const rows = (await sql`
    WITH query AS (
      SELECT CASE
               WHEN ${tsQuery} = '' THEN NULL
               ELSE to_tsquery('simple', ${tsQuery})
             END AS value
    )
    SELECT c.id AS chunk_id,
           c.document_id,
           c.node_id,
           d.so_hieu,
           c.duong_dan AS breadcrumb,
           c.noi_dung AS content,
           least(
             1,
             CASE
               WHEN ${legalIdentifier}::text IS NOT NULL
                AND f_unaccent(coalesce(d.so_hieu, '')) = f_unaccent(${legalIdentifier}::text)
                 THEN 1
               ELSE coalesce(ts_rank_cd(c.tsv, query.value, 32), 0)
             END
           )::float8 AS score
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    CROSS JOIN query
    WHERE c.strategy = ${options.strategy}
      AND (
        (query.value IS NOT NULL AND c.tsv @@ query.value)
        OR (
          ${legalIdentifier}::text IS NOT NULL
          AND f_unaccent(coalesce(d.so_hieu, '')) = f_unaccent(${legalIdentifier}::text)
        )
      )
    ORDER BY score DESC, c.id
    LIMIT ${options.topK}
  `) as unknown as FulltextRow[];

  return rows.map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    nodeId: row.node_id,
    soHieu: row.so_hieu,
    breadcrumb: row.breadcrumb,
    content: row.content,
    score: Number(row.score),
    fulltextScore: Number(row.score),
  }));
}
