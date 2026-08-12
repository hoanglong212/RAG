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
  "bao", "bang", "cac", "cho", "cua", "duoc", "gi", "la", "nhieu",
  "dieu", "diem", "dinh", "khoan", "nao", "nghi", "nhung", "quy", "so",
  "the", "theo", "thi", "thong", "trong", "tu", "van", "ve", "va",
]);

export interface LegalLocator {
  dieu: number | null;
  khoan: number | null;
  diem: string | null;
}

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

export function extractLegalLocator(question: string): LegalLocator {
  const plain = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
  return {
    dieu: readNumber(plain, /\bdieu\s+(\d+)\b/),
    khoan: readNumber(plain, /\bkhoan\s+(\d+)\b/),
    diem: plain.match(/\bdiem\s+([a-z])\b/)?.[1] ?? null,
  };
}

/** Full-text tiếng Việt dùng simple + f_unaccent, cộng boost cho số hiệu chính xác. */
export async function fulltextSearch(
  question: string,
  options: { topK: number; strategy: ChunkStrategy; legalTopics?: string[] },
  sql: postgres.Sql,
): Promise<RetrievalResult[]> {
  const legalIdentifier = extractLegalIdentifier(question);
  const locator = extractLegalLocator(question);
  const semanticQuestion = (legalIdentifier ? question.replace(legalIdentifier, " ") : question)
    .replace(/\b(?:điều|khoản)\s+\d+\b/gi, " ")
    .replace(/\bđiểm\s+[a-z]\b/gi, " ");
  const tsQuery = buildTsQuery(semanticQuestion);
  const strictTsQuery = tsQuery.replaceAll(" | ", " & ");
  if (tsQuery === "" && legalIdentifier === null) return [];
  const legalTopics = options.legalTopics ?? [];

  const rows = (await sql`
    WITH query AS (
      SELECT CASE
               WHEN ${tsQuery} = '' THEN NULL
               ELSE to_tsquery('simple', ${tsQuery})
             END AS value,
             CASE
               WHEN ${strictTsQuery} = '' THEN NULL
               ELSE to_tsquery('simple', ${strictTsQuery})
             END AS strict_value
    ), ranked AS (
      SELECT c.id AS chunk_id,
             c.document_id,
             c.node_id,
             d.so_hieu,
             c.duong_dan AS breadcrumb,
             c.noi_dung AS content,
             coalesce(ts_rank_cd(c.tsv, query.value, 32), 0)
             + CASE
                 WHEN query.strict_value IS NOT NULL AND c.tsv @@ query.strict_value THEN 1
                 ELSE 0
               END
             + CASE
                 WHEN ${legalIdentifier}::text IS NOT NULL
                  AND f_unaccent(coalesce(d.so_hieu, '')) = f_unaccent(${legalIdentifier}::text)
                   THEN 0.5
                 ELSE 0
               END AS raw_score,
             CASE
               WHEN ${locator.dieu}::int IS NOT NULL AND c.dieu_so = ${locator.dieu}
                AND (${locator.khoan}::int IS NULL OR c.khoan_so = ${locator.khoan})
                AND (${locator.diem}::text IS NULL OR c.diem = ${locator.diem})
                 THEN 2
               ELSE 0
             END AS locator_score
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
      CROSS JOIN query
      WHERE c.strategy = ${options.strategy}
        AND d.retrieval_enabled = true
        AND (cardinality(${legalTopics}::text[]) = 0 OR d.legal_topics && ${legalTopics}::text[])
        AND (
          (query.value IS NOT NULL AND c.tsv @@ query.value)
          OR (
            query.value IS NULL
            AND
            ${legalIdentifier}::text IS NOT NULL
            AND f_unaccent(coalesce(d.so_hieu, '')) = f_unaccent(${legalIdentifier}::text)
          )
        )
    )
    SELECT chunk_id,
           document_id,
           node_id,
           so_hieu,
           breadcrumb,
           content,
           ((raw_score + locator_score) / (1 + raw_score + locator_score))::float8 AS score
    FROM ranked
    ORDER BY raw_score + locator_score DESC, chunk_id
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

function readNumber(value: string, pattern: RegExp): number | null {
  const match = value.match(pattern)?.[1];
  return match === undefined ? null : Number(match);
}
