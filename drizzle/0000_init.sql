-- Bat extension TRUOC khi tao bang.
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
-- Postgres KHONG co cau hinh full-text cho tieng Viet: to_tsvector('vietnamese', ...)
-- se loi. Dung 'simple' + bo dau de tim "nghi dinh" van ra "nghị định".
--
-- Nhung unaccent(text) duoc khai bao STABLE, ma cot generated bat buoc bieu thuc
-- phai IMMUTABLE -> dung nguyen van nhu vay Postgres se tu choi tao bang.
-- Ban 2 tham so unaccent(regdictionary, text) moi la IMMUTABLE, nen boc lai o day.
-- search_path duoc ghim vi tren Supabase extension nam o schema "extensions".
CREATE OR REPLACE FUNCTION f_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
SET search_path = public, extensions, pg_catalog
AS $$ SELECT unaccent('unaccent', $1) $$;--> statement-breakpoint
CREATE TABLE "cau_hoi_eval" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cau_hoi" text NOT NULL,
	"chunk_dung_ids" uuid[],
	"ghi_chu" text
);
--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"chuong" text,
	"chuong_tieu_de" text,
	"muc" text,
	"muc_tieu_de" text,
	"dieu_so" integer,
	"dieu_tieu_de" text,
	"khoan_so" integer,
	"diem" text,
	"phu_luc" text,
	"duong_dan" text NOT NULL,
	"noi_dung" text NOT NULL,
	"noi_dung_kem_ngu_canh" text NOT NULL,
	"vi_tri_trang" integer,
	"so_token" integer NOT NULL,
	"bi_cat_cung" boolean DEFAULT false NOT NULL,
	"embedding" vector(768),
	"tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', f_unaccent(coalesce(noi_dung, '')))) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ten_file" text NOT NULL,
	"so_hieu" text,
	"loai_van_ban" text,
	"co_quan_ban_hanh" text,
	"ngay_ban_hanh" date,
	"ngay_hieu_luc" date,
	"trich_yeu" text,
	"so_trang" integer,
	"trang_thai" text DEFAULT 'dang_xu_ly' NOT NULL,
	"loi_chi_tiet" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lan_chay_eval" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ten_lan_chay" text NOT NULL,
	"cau_hinh" jsonb,
	"recall_at_5" real,
	"mrr" real,
	"so_cau_hoi" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "truy_van" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cau_hoi" text NOT NULL,
	"cau_tra_loi" text,
	"chunk_ids" uuid[],
	"diem_cao_nhat" real,
	"co_trich_dan" boolean,
	"latency_ms" integer,
	"che_do_tim" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chunks_embedding_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "chunks_tsv_idx" ON "chunks" USING gin ("tsv");--> statement-breakpoint
CREATE INDEX "chunks_document_id_idx" ON "chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "chunks_dieu_so_idx" ON "chunks" USING btree ("dieu_so");--> statement-breakpoint
CREATE INDEX "documents_so_hieu_idx" ON "documents" USING btree ("so_hieu");--> statement-breakpoint
CREATE INDEX "truy_van_created_at_idx" ON "truy_van" USING btree ("created_at" DESC NULLS LAST);