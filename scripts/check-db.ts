/**
 * Kiem tra ket noi DB, extension, bang va index.
 *   npx tsx scripts/check-db.ts
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const BANG_CAN_CO = [
  "cau_hoi_eval",
  "chunks",
  "doc_nodes",
  "document_relations",
  "documents",
  "lan_chay_eval",
  "legal_cases",
  "news_articles",
  "news_sources",
  "news_sync_runs",
  "truy_van",
  "user_profiles",
  "watchlists",
];

const COT_D1_CAN_CO: Record<string, string[]> = {
  chunks: ["node_id", "strategy"],
  doc_nodes: ["document_id", "parent_id", "node_type", "order_index", "depth"],
  documents: [
    "trang_thai",
    "parse_warnings",
    "loai_van_ban_raw",
    "ingest_status",
    "source_ref",
    "source_url",
    "legal_topics",
    "verified_at",
    "retrieval_enabled",
    "validity_note",
  ],
  lan_chay_eval: ["recall_at_10", "embedder_name", "strategy"],
};

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ Thiếu DATABASE_URL. Tạo .env.local từ .env.example rồi điền chuỗi kết nối.");
    process.exit(1);
  }

  const sql = postgres(url, { prepare: !url.includes(":6543"), max: 1 });
  let loi = 0;

  try {
    const [{ version }] = await sql<{ version: string }[]>`SELECT version()`;
    console.log(`✓ Kết nối được: ${version.split(",")[0]}`);

    const ext = await sql<{ extname: string; nspname: string }[]>`
      SELECT e.extname, n.nspname
      FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname IN ('vector', 'unaccent')
      ORDER BY e.extname`;
    for (const ten of ["unaccent", "vector"]) {
      const co = ext.find((x) => x.extname === ten);
      if (co) console.log(`✓ Extension ${ten} (schema ${co.nspname})`);
      else {
        console.error(`✗ Thiếu extension ${ten}. Chạy: npm run db:migrate`);
        loi += 1;
      }
    }

    const [{ v }] = await sql<{ v: string }[]>`SELECT '[1,2,3]'::vector AS v`;
    console.log(`✓ Kiểu vector dùng được: ${v}`);

    const [{ tsv }] = await sql<{ tsv: string }[]>`
      SELECT to_tsvector('simple', f_unaccent('Nghị định về an toàn thực phẩm'))::text AS tsv`;
    console.log(`✓ f_unaccent + to_tsvector('simple'): ${tsv}`);

    const bang = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name`;
    const ten = bang.map((b) => b.table_name);
    console.log(`\nBảng trong schema public (${ten.length}):`);
    for (const t of ten) {
      const [{ n }] = await sql<{ n: number }[]>`
        SELECT count(*)::int AS n FROM ${sql(t)}`;
      console.log(`  ${t.padEnd(16)} ${n} dòng`);
    }
    const thieu = BANG_CAN_CO.filter((b) => !ten.includes(b));
    if (thieu.length > 0) {
      console.error(`✗ Thiếu bảng: ${thieu.join(", ")}. Chạy: npm run db:migrate`);
      loi += 1;
    } else {
      console.log(`✓ Đủ ${BANG_CAN_CO.length} bảng bắt buộc của schema hiện tại`);
    }

    const cot = await sql<{ table_name: string; column_name: string }[]>`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY(${Object.keys(COT_D1_CAN_CO)})`;
    for (const [table, requiredColumns] of Object.entries(COT_D1_CAN_CO)) {
      const actual = cot.filter((item) => item.table_name === table).map((item) => item.column_name);
      const missing = requiredColumns.filter((column) => !actual.includes(column));
      if (missing.length > 0) {
        console.error(`✗ Bảng ${table} thiếu cột D1: ${missing.join(", ")}`);
        loi += 1;
      }
    }

    const idx = await sql<{ indexname: string; indexdef: string }[]>`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename IN ('chunks', 'doc_nodes', 'documents', 'truy_van', 'legal_cases', 'watchlists')
      ORDER BY indexname`;
    console.log(`\nIndex (${idx.length}):`);
    for (const i of idx) console.log(`  ${i.indexname}`);
    for (const can of [
      "chunks_embedding_idx",
      "chunks_tsv_idx",
      "chunks_node_id_idx",
      "chunks_strategy_idx",
      "doc_nodes_document_order_idx",
      "doc_nodes_parent_id_idx",
      "legal_cases_user_updated_idx",
      "watchlists_user_idx",
    ]) {
      if (!idx.some((i) => i.indexname === can)) {
        console.error(`✗ Thiếu index ${can}`);
        loi += 1;
      }
    }

    const catalogCoverage = await sql<
      Array<{
        topic: string;
        documents: number;
        chunks: number;
        embedded_chunks: number;
        total_tokens: number;
      }>
    >`
      SELECT topic,
             count(DISTINCT d.id)::int AS documents,
             count(c.id)::int AS chunks,
             count(c.embedding)::int AS embedded_chunks,
             coalesce(sum(c.so_token), 0)::int AS total_tokens
      FROM documents d
      CROSS JOIN LATERAL unnest(d.legal_topics) topic
      LEFT JOIN chunks c ON c.document_id = d.id
      WHERE d.retrieval_enabled = true
      GROUP BY topic
      ORDER BY topic`;
    if (catalogCoverage.length > 0) {
      console.log("\nCorpus pháp lý theo chủ đề:");
      for (const item of catalogCoverage) {
        console.log(
          `  ${item.topic.padEnd(22)} ${item.documents} văn bản, ${item.chunks} chunks, ${item.total_tokens} tokens`,
        );
        if (item.chunks !== item.embedded_chunks) {
          console.error(`✗ Chủ đề ${item.topic} thiếu ${item.chunks - item.embedded_chunks} embedding.`);
          loi += 1;
        }
      }
    }
  } finally {
    await sql.end();
  }

  if (loi > 0) {
    console.error(`\n${loi} vấn đề cần xử lý.`);
    process.exit(1);
  }
  console.log("\n✓ Database khớp schema hiện tại và sẵn sàng phục vụ nền tảng.");
}

main().catch((e: unknown) => {
  console.error("✗ Lỗi:", e instanceof Error ? e.message : e);
  process.exit(1);
});
