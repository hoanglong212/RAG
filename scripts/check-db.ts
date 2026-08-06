/**
 * Kiem tra ket noi DB, extension, bang va index.
 *   npx tsx scripts/check-db.ts
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const BANG_CAN_CO = ["cau_hoi_eval", "chunks", "documents", "lan_chay_eval", "truy_van"];

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
      console.log("✓ Đủ 5 bảng theo PLAN.md mục 3");
    }

    const idx = await sql<{ indexname: string; indexdef: string }[]>`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename IN ('chunks', 'documents', 'truy_van')
      ORDER BY indexname`;
    console.log(`\nIndex (${idx.length}):`);
    for (const i of idx) console.log(`  ${i.indexname}`);
    for (const can of ["chunks_embedding_idx", "chunks_tsv_idx"]) {
      if (!idx.some((i) => i.indexname === can)) {
        console.error(`✗ Thiếu index ${can}`);
        loi += 1;
      }
    }
  } finally {
    await sql.end();
  }

  if (loi > 0) {
    console.error(`\n${loi} vấn đề cần xử lý.`);
    process.exit(1);
  }
  console.log("\n✓ Database sẵn sàng cho Phase 3.");
}

main().catch((e: unknown) => {
  console.error("✗ Lỗi:", e instanceof Error ? e.message : e);
  process.exit(1);
});
