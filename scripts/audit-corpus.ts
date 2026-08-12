/** Kiểm tra nhanh corpus: độ phủ hai chiến lược và các văn bản bắt buộc. */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL.");
  const sql = postgres(url, { prepare: !url.includes(":6543"), max: 1 });
  try {
    const strategies = await sql`
      SELECT strategy,
             count(*)::int AS n_chunks,
             count(DISTINCT document_id)::int AS n_docs,
             sum(so_token)::int AS total_tokens,
             round(avg(so_token))::int AS avg_tokens,
             count(*) FILTER (WHERE embedding IS NULL)::int AS missing_embeddings,
             min(vector_dims(embedding))::int AS min_dimensions,
             max(vector_dims(embedding))::int AS max_dimensions
      FROM chunks
      GROUP BY strategy
      ORDER BY strategy
    `;
    console.table(strategies);

    const required = await sql`
      SELECT d.so_hieu,
             d.ingest_status,
             count(*) FILTER (WHERE c.strategy = 'structural')::int AS structural_chunks,
             count(*) FILTER (WHERE c.strategy = 'fixed')::int AS fixed_chunks,
             count(DISTINCT c.strategy)::int AS strategies
      FROM documents d
      LEFT JOIN chunks c ON c.document_id = d.id
      WHERE d.so_hieu IN ('115/2018/NĐ-CP', '124/2021/NĐ-CP')
      GROUP BY d.id, d.so_hieu, d.ingest_status
      ORDER BY d.so_hieu
    `;
    console.table(required);

    if (required.length !== 2 || required.some((row) => Number(row.strategies) !== 2)) {
      throw new Error("Corpus chưa có đủ 115/2018 và 124/2021 ở cả hai chiến lược.");
    }
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
