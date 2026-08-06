/**
 * Luoc do Drizzle theo PLAN.md muc 3.
 * Ten cot giu tieng Viet khong dau vi day la thuat ngu nghiep vu.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * So chieu vector lay tu bien moi truong. Doi model o Phase 7 thi doi bien nay
 * roi sinh migration moi va embed lai toan bo chunk.
 */
export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 768);

/** Drizzle chua co kieu tsvector san. */
const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

export type TrangThaiTaiLieu = "dang_xu_ly" | "hoan_tat" | "loi";
export type CheDoTim = "vector" | "hybrid";

/* ------------------------------------------------------------------ */

/** Moi van ban goc. */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ten_file: text("ten_file").notNull(),
    /** "15/2020/NĐ-CP" */
    so_hieu: text("so_hieu"),
    /** "Nghị định" | "Thông tư" | "Quyết định" | ... */
    loai_van_ban: text("loai_van_ban"),
    co_quan_ban_hanh: text("co_quan_ban_hanh"),
    ngay_ban_hanh: date("ngay_ban_hanh"),
    ngay_hieu_luc: date("ngay_hieu_luc"),
    /** Tieu de tom tat. */
    trich_yeu: text("trich_yeu"),
    so_trang: integer("so_trang"),
    trang_thai: text("trang_thai").$type<TrangThaiTaiLieu>().notNull().default("dang_xu_ly"),
    loi_chi_tiet: text("loi_chi_tiet"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("documents_so_hieu_idx").on(t.so_hieu)],
);

/** Don vi truy hoi. */
export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    document_id: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    /** "Chương II" */
    chuong: text("chuong"),
    chuong_tieu_de: text("chuong_tieu_de"),
    muc: text("muc"),
    muc_tieu_de: text("muc_tieu_de"),
    /** null khi chunk thuoc phan phu luc. */
    dieu_so: integer("dieu_so"),
    /** "Điều kiện cấp giấy phép" */
    dieu_tieu_de: text("dieu_tieu_de"),
    /** null khi chunk la ca Dieu. */
    khoan_so: integer("khoan_so"),
    /** "a", null neu khong cat toi Diem. */
    diem: text("diem"),
    /** Ten phu luc; khac null thi chunk khong thuoc Dieu nao. */
    phu_luc: text("phu_luc"),
    /** "Nghị định 15/2020/NĐ-CP > Chương II > Điều 8 > Khoản 3" */
    duong_dan: text("duong_dan").notNull(),
    noi_dung: text("noi_dung").notNull(),
    /** duong_dan + noi_dung — DAY la thu dem di embed. */
    noi_dung_kem_ngu_canh: text("noi_dung_kem_ngu_canh").notNull(),
    vi_tri_trang: integer("vi_tri_trang"),
    so_token: integer("so_token").notNull(),
    /** true khi phai cat cung theo cau vi khoi van ban qua dai. */
    bi_cat_cung: boolean("bi_cat_cung").notNull().default(false),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIM }),
    /**
     * Generated column. Postgres KHONG co cau hinh full-text cho tieng Viet,
     * nen dung 'simple' + bo dau. Xem chu thich ve f_unaccent trong migration.
     */
    tsv: tsvector("tsv").generatedAlwaysAs(
      sql`to_tsvector('simple', f_unaccent(coalesce(noi_dung, '')))`,
    ),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("chunks_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
    index("chunks_tsv_idx").using("gin", t.tsv),
    index("chunks_document_id_idx").on(t.document_id),
    index("chunks_dieu_so_idx").on(t.dieu_so),
  ],
);

/** Log moi cau hoi, nuoi Khu B cua dashboard. */
export const truy_van = pgTable(
  "truy_van",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cau_hoi: text("cau_hoi").notNull(),
    cau_tra_loi: text("cau_tra_loi"),
    /** Cac chunk duoc retrieve. */
    chunk_ids: uuid("chunk_ids").array(),
    /** Diem cua chunk top 1. */
    diem_cao_nhat: real("diem_cao_nhat"),
    /** LLM co trich duoc nguon khong. */
    co_trich_dan: boolean("co_trich_dan"),
    latency_ms: integer("latency_ms"),
    che_do_tim: text("che_do_tim").$type<CheDoTim>(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("truy_van_created_at_idx").on(t.created_at.desc())],
);

/** Bo danh gia tu soan. */
export const cau_hoi_eval = pgTable("cau_hoi_eval", {
  id: uuid("id").primaryKey().defaultRandom(),
  cau_hoi: text("cau_hoi").notNull(),
  /** Dap an: chunk nao moi dung. */
  chunk_dung_ids: uuid("chunk_dung_ids").array(),
  ghi_chu: text("ghi_chu"),
});

/** Ket qua tung lan do. */
export const lan_chay_eval = pgTable("lan_chay_eval", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** "baseline-vector-only" */
  ten_lan_chay: text("ten_lan_chay").notNull(),
  /** {mode, topK, model, ...} */
  cau_hinh: jsonb("cau_hinh"),
  recall_at_5: real("recall_at_5"),
  mrr: real("mrr"),
  so_cau_hoi: integer("so_cau_hoi"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type DocumentMoi = typeof documents.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;
export type ChunkMoi = typeof chunks.$inferInsert;
export type TruyVanMoi = typeof truy_van.$inferInsert;
export type CauHoiEval = typeof cau_hoi_eval.$inferSelect;
export type LanChayEvalMoi = typeof lan_chay_eval.$inferInsert;
