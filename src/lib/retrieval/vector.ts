import type postgres from "postgres";
import type { EmbeddingProvider } from "../embedding/provider";
import type { ChunkStrategy } from "../db/schema";

export interface RetrievalResult {
  chunkId: string;
  documentId: string;
  nodeId: string | null;
  soHieu: string | null;
  breadcrumb: string;
  content: string;
  score: number;
  vectorScore?: number;
  fulltextScore?: number;
  rrfScore?: number;
}

interface VectorRow {
  chunk_id: string;
  document_id: string;
  node_id: string | null;
  so_hieu: string | null;
  breadcrumb: string;
  content: string;
  score: number;
}

export interface VectorSearchOptions {
  topK: number;
  strategy: ChunkStrategy;
  candidateK?: number;
  legalTopics?: string[];
}

/** Embed câu hỏi rồi xếp hạng chunk bằng cosine similarity của pgvector. */
export async function vectorSearch(
  question: string,
  options: VectorSearchOptions,
  dependencies: { sql: postgres.Sql; embeddingProvider: EmbeddingProvider },
): Promise<RetrievalResult[]> {
  const [embedding] = await dependencies.embeddingProvider.embed([question]);
  if (!embedding) throw new Error("Embedding service không trả vector cho câu hỏi.");
  const vectorLiteral = `[${embedding.join(",")}]`;
  const limit = Math.max(options.topK, options.candidateK ?? options.topK);
  const legalTopics = options.legalTopics ?? [];

  const rows = (await dependencies.sql`
    SELECT c.id AS chunk_id,
           c.document_id,
           c.node_id,
           d.so_hieu,
           c.duong_dan AS breadcrumb,
           c.noi_dung AS content,
           greatest(0, least(1, 1 - (c.embedding <=> ${vectorLiteral}::vector)))::float8 AS score
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    WHERE c.strategy = ${options.strategy}
      AND c.embedding IS NOT NULL
      AND d.retrieval_enabled = true
      AND (cardinality(${legalTopics}::text[]) = 0 OR d.legal_topics && ${legalTopics}::text[])
    ORDER BY c.embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `) as unknown as VectorRow[];

  return rows.slice(0, options.topK).map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    nodeId: row.node_id,
    soHieu: row.so_hieu,
    breadcrumb: row.breadcrumb,
    content: row.content,
    score: Number(row.score),
    vectorScore: Number(row.score),
  }));
}
