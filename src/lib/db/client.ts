/**
 * Ket noi Postgres (postgres.js) + Drizzle client dung chung.
 * Giu mot ket noi duy nhat qua cac lan hot-reload cua Next dev.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function taoKetNoi(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Thiếu biến môi trường DATABASE_URL. Sao chép .env.example thành .env.local rồi điền chuỗi kết nối Supabase.",
    );
  }
  // Transaction pooler cua Supabase (cong 6543) khong ho tro prepared statement.
  const quaPooler = url.includes(":6543");
  return postgres(url, {
    prepare: !quaPooler,
    max: quaPooler ? 1 : 10,
  });
}

const bienToanCuc = globalThis as unknown as { __sql?: postgres.Sql };

export const sql: postgres.Sql = bienToanCuc.__sql ?? taoKetNoi();
if (process.env.NODE_ENV !== "production") bienToanCuc.__sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
