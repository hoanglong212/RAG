/**
 * Luoc do Drizzle theo PLAN.md muc 3.
 * Ten cot giu tieng Viet khong dau vi day la thuat ngu nghiep vu.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { CanhBao } from "../parser";
import type {
  ChatRequest,
  LoaiVanBan,
  NodeType,
  TrangThaiHieuLuc as ContractTrangThaiHieuLuc,
} from "../../types/contract";

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

export type IngestStatus = "dang_xu_ly" | "hoan_tat" | "loi";
export type TrangThaiHieuLuc = ContractTrangThaiHieuLuc;
export type LoaiVanBanSlug = LoaiVanBan;
export type ChunkStrategy = NonNullable<ChatRequest["strategy"]>;
export type DocNodeType = NodeType;
export type CheDoTim = "vector" | "hybrid";
export type QuanHeVanBan =
  | "sua_doi_bo_sung"
  | "thay_the"
  | "bai_bo"
  | "quy_dinh_chi_tiet"
  | "quy_dinh_xu_phat"
  | "hop_nhat";

/* ------------------------------------------------------------------ */

/** Moi van ban goc. */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ten_file: text("ten_file").notNull(),
    /** "15/2020/NĐ-CP" */
    so_hieu: text("so_hieu"),
    /** Slug dong theo docs/CONTRACT.md. */
    loai_van_ban: text("loai_van_ban").$type<LoaiVanBanSlug>(),
    /** Cach viet nguyen van parser doc duoc, dung de sua cac truong hop roi vao `khac`. */
    loai_van_ban_raw: text("loai_van_ban_raw"),
    co_quan_ban_hanh: text("co_quan_ban_hanh"),
    ngay_ban_hanh: date("ngay_ban_hanh"),
    ngay_hieu_luc: date("ngay_hieu_luc"),
    /** Tieu de tom tat. */
    trich_yeu: text("trich_yeu"),
    /** Ma doi chieu ben nguon, vi du vanban.chinhphu.vn:211189. */
    source_ref: text("source_ref"),
    source_url: text("source_url"),
    legal_topics: text("legal_topics").array().notNull().default(sql`'{}'::text[]`),
    /** Thoi diem metadata nguon chinh thong duoc doi chieu gan nhat. */
    verified_at: timestamp("verified_at", { withTimezone: true }),
    /** False voi van ban da ban hanh nhung chua den ngay co hieu luc. */
    retrieval_enabled: boolean("retrieval_enabled").notNull().default(true),
    /** Ghi chu hieu luc chi tiet hon contract, vi du het hieu luc mot phan. */
    validity_note: text("validity_note"),
    so_trang: integer("so_trang"),
    trang_thai: text("trang_thai")
      .$type<TrangThaiHieuLuc>()
      .notNull()
      .default("chua_xac_dinh"),
    parse_warnings: jsonb("parse_warnings")
      .$type<CanhBao[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Trang thai ky thuat cua pipeline; tach khoi trang_thai hieu luc. */
    ingest_status: text("ingest_status").$type<IngestStatus>().notNull().default("dang_xu_ly"),
    loi_chi_tiet: text("loi_chi_tiet"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("documents_so_hieu_idx").on(t.so_hieu),
    uniqueIndex("documents_source_ref_uidx").on(t.source_ref),
    index("documents_legal_topics_idx").using("gin", t.legal_topics),
  ],
);

/** Quan he phap ly co nguon kiem chung giua hai van ban trong corpus. */
export const document_relations = pgTable(
  "document_relations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source_document_id: uuid("source_document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    target_document_id: uuid("target_document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    relation_type: text("relation_type").$type<QuanHeVanBan>().notNull(),
    effective_from: date("effective_from"),
    note: text("note"),
    source_url: text("source_url").notNull(),
    verified_at: timestamp("verified_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("document_relations_pair_type_uidx").on(
      t.source_document_id,
      t.target_document_id,
      t.relation_type,
    ),
    index("document_relations_target_idx").on(t.target_document_id),
  ],
);

/** Cay cau truc ben vung cua van ban, doc lap voi moi chien luoc chunking. */
export const doc_nodes = pgTable(
  "doc_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    document_id: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    parent_id: uuid("parent_id").references((): AnyPgColumn => doc_nodes.id, {
      onDelete: "cascade",
    }),
    node_type: text("node_type").$type<DocNodeType>().notNull(),
    so_thu_tu: text("so_thu_tu"),
    tieu_de: text("tieu_de"),
    noi_dung: text("noi_dung").notNull().default(""),
    breadcrumb: text("breadcrumb").notNull(),
    order_index: integer("order_index").notNull(),
    depth: integer("depth").notNull().default(0),
  },
  (t) => [
    index("doc_nodes_document_order_idx").on(t.document_id, t.order_index),
    index("doc_nodes_parent_id_idx").on(t.parent_id),
  ],
);

/** Don vi truy hoi. */
export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    document_id: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    node_id: uuid("node_id").references(() => doc_nodes.id, { onDelete: "cascade" }),
    strategy: text("strategy").$type<ChunkStrategy>().notNull().default("structural"),
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
    index("chunks_strategy_idx").on(t.strategy),
    index("chunks_node_id_idx").on(t.node_id),
    check(
      "chunk_structural_has_node",
      sql`${t.strategy} <> 'structural' OR ${t.node_id} IS NOT NULL`,
    ),
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
  recall_at_10: real("recall_at_10"),
  embedder_name: text("embedder_name"),
  strategy: text("strategy").$type<ChunkStrategy>(),
  mrr: real("mrr"),
  so_cau_hoi: integer("so_cau_hoi"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Nguồn RSS chính thức; chỉ lưu metadata và liên kết bài gốc. */
export const news_sources = pgTable(
  "news_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    feed_url: text("feed_url").notNull(),
    homepage_url: text("homepage_url").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    last_fetched_at: timestamp("last_fetched_at", { withTimezone: true }),
    last_error: text("last_error"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("news_sources_slug_uidx").on(t.slug),
    uniqueIndex("news_sources_feed_url_uidx").on(t.feed_url),
  ],
);

/** Bài tin đã chuẩn hóa từ RSS. Không sao chép toàn văn bài báo. */
export const news_articles = pgTable(
  "news_articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source_id: uuid("source_id")
      .notNull()
      .references(() => news_sources.id, { onDelete: "cascade" }),
    /** SHA-256 của URL canonical, tránh index trực tiếp URL rất dài. */
    external_id: text("external_id").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    image_url: text("image_url"),
    published_at: timestamp("published_at", { withTimezone: true }),
    topics: text("topics").array().notNull().default(sql`'{}'::text[]`),
    keywords: text("keywords").array().notNull().default(sql`'{}'::text[]`),
    locations: text("locations").array().notNull().default(sql`'{}'::text[]`),
    fetched_at: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("news_articles_source_external_uidx").on(t.source_id, t.external_id),
    index("news_articles_published_at_idx").on(t.published_at.desc()),
    index("news_articles_source_id_idx").on(t.source_id),
    index("news_articles_topics_idx").using("gin", t.topics),
  ],
);

/** Nhật ký mỗi lần đồng bộ để dashboard giám sát nguồn lỗi. */
export const news_sync_runs = pgTable("news_sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source_id: uuid("source_id").references(() => news_sources.id, { onDelete: "set null" }),
  status: text("status").notNull(),
  fetched_count: integer("fetched_count").notNull().default(0),
  inserted_count: integer("inserted_count").notNull().default(0),
  updated_count: integer("updated_count").notNull().default(0),
  error: text("error"),
  started_at: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finished_at: timestamp("finished_at", { withTimezone: true }),
});

export type Document = typeof documents.$inferSelect;
export type DocumentMoi = typeof documents.$inferInsert;
export type DocumentRelation = typeof document_relations.$inferSelect;
export type Chunk = typeof chunks.$inferSelect;
export type ChunkMoi = typeof chunks.$inferInsert;
export type DocNode = typeof doc_nodes.$inferSelect;
export type DocNodeMoi = typeof doc_nodes.$inferInsert;
export type TruyVanMoi = typeof truy_van.$inferInsert;
export type CauHoiEval = typeof cau_hoi_eval.$inferSelect;
export type LanChayEvalMoi = typeof lan_chay_eval.$inferInsert;
export type NewsSource = typeof news_sources.$inferSelect;
export type NewsArticle = typeof news_articles.$inferSelect;
export type NewsSyncRun = typeof news_sync_runs.$inferSelect;
