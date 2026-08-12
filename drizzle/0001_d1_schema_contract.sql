CREATE TABLE "doc_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"parent_id" uuid,
	"node_type" text NOT NULL,
	"so_thu_tu" text,
	"tieu_de" text,
	"noi_dung" text DEFAULT '' NOT NULL,
	"breadcrumb" text NOT NULL,
	"order_index" integer NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "node_id" uuid;--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "strategy" text DEFAULT 'structural' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "loai_van_ban_raw" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "parse_warnings" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ingest_status" text DEFAULT 'dang_xu_ly' NOT NULL;--> statement-breakpoint
-- `trang_thai` cua migration 0000 la trang thai ingest. D1 dung ten nay cho
-- trang thai hieu luc, nen chuyen du lieu cu sang cot moi truoc khi doi nghia.
UPDATE "documents"
SET "ingest_status" = "trang_thai"
WHERE "trang_thai" IN ('dang_xu_ly', 'hoan_tat', 'loi');--> statement-breakpoint
-- Phase 3 cu da luu parser warnings dang JSON trong loi_chi_tiet khi ingest thanh cong.
UPDATE "documents"
SET "parse_warnings" = COALESCE(("loi_chi_tiet"::jsonb)->'parser', '[]'::jsonb),
    "loi_chi_tiet" = NULL
WHERE "ingest_status" = 'hoan_tat' AND "loi_chi_tiet" IS NOT NULL;--> statement-breakpoint
-- Giu chuoi loai cu lam raw, sau do chuan hoa cot chinh sang slug dong.
UPDATE "documents" SET "loai_van_ban_raw" = "loai_van_ban"
WHERE "loai_van_ban" IS NOT NULL;--> statement-breakpoint
UPDATE "documents"
SET "loai_van_ban" = CASE lower("loai_van_ban")
  WHEN 'nghị định' THEN 'nghi_dinh'
  WHEN 'thông tư' THEN 'thong_tu'
  WHEN 'thông tư liên tịch' THEN 'thong_tu'
  WHEN 'quyết định' THEN 'quyet_dinh'
  WHEN 'luật' THEN 'luat'
  WHEN 'nghị quyết' THEN 'nghi_quyet'
  WHEN 'công văn' THEN 'cong_van'
  ELSE 'khac'
END
WHERE "loai_van_ban" IS NOT NULL;--> statement-breakpoint
UPDATE "documents" SET "trang_thai" = 'chua_xac_dinh';--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "trang_thai" SET DEFAULT 'chua_xac_dinh';--> statement-breakpoint
ALTER TABLE "lan_chay_eval" ADD COLUMN "recall_at_10" real;--> statement-breakpoint
ALTER TABLE "lan_chay_eval" ADD COLUMN "embedder_name" text;--> statement-breakpoint
ALTER TABLE "lan_chay_eval" ADD COLUMN "strategy" text;--> statement-breakpoint
ALTER TABLE "doc_nodes" ADD CONSTRAINT "doc_nodes_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_nodes" ADD CONSTRAINT "doc_nodes_parent_id_doc_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."doc_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_nodes_document_order_idx" ON "doc_nodes" USING btree ("document_id","order_index");--> statement-breakpoint
CREATE INDEX "doc_nodes_parent_id_idx" ON "doc_nodes" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_node_id_doc_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."doc_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chunks_strategy_idx" ON "chunks" USING btree ("strategy");--> statement-breakpoint
CREATE INDEX "chunks_node_id_idx" ON "chunks" USING btree ("node_id");--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunk_structural_has_node" CHECK ("chunks"."strategy" <> 'structural' OR "chunks"."node_id" IS NOT NULL);
