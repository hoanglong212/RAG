import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/client";
import type { TimelineDocument, TimelineRelation } from "@/types/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ documentId: z.string().uuid(), at: z.coerce.date().optional() });

export async function GET(request: Request) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Văn bản hoặc thời điểm không hợp lệ." }, { status: 400 });
  const at = (parsed.data.at ?? new Date()).toISOString().slice(0, 10);
  const [documents, relations] = await Promise.all([
    sql`
      SELECT id, so_hieu, trich_yeu, ngay_ban_hanh, ngay_hieu_luc, trang_thai,
             validity_note, source_url
      FROM documents WHERE id = ${parsed.data.documentId} LIMIT 1`,
    sql`
      SELECT r.id, r.relation_type, r.effective_from, r.note, r.source_url,
             CASE WHEN r.source_document_id = ${parsed.data.documentId} THEN 'outgoing' ELSE 'incoming' END AS direction,
             d.id AS related_id, d.so_hieu AS related_so_hieu, d.trich_yeu AS related_trich_yeu
      FROM document_relations r
      JOIN documents d ON d.id = CASE
        WHEN r.source_document_id = ${parsed.data.documentId} THEN r.target_document_id
        ELSE r.source_document_id END
      WHERE r.source_document_id = ${parsed.data.documentId} OR r.target_document_id = ${parsed.data.documentId}
      ORDER BY r.effective_from NULLS LAST`,
  ]);
  const row = documents[0];
  if (!row) return NextResponse.json({ error: "Không tìm thấy văn bản." }, { status: 404 });
  const ended = relations.some((relation) =>
    relation.direction === "incoming" &&
    ["thay_the", "bai_bo"].includes(String(relation.relation_type)) &&
    relation.effective_from !== null && String(relation.effective_from) <= at,
  );
  const started = row.ngay_hieu_luc === null || String(row.ngay_hieu_luc) <= at;
  const today = new Date().toISOString().slice(0, 10);
  const expiredByCurrentStatus = row.trang_thai === "het_hieu_luc" && at >= today;
  const document: TimelineDocument = {
    id: String(row.id), soHieu: nullable(row.so_hieu), trichYeu: nullable(row.trich_yeu),
    ngayBanHanh: nullable(row.ngay_ban_hanh), ngayHieuLuc: nullable(row.ngay_hieu_luc),
    trangThai: row.trang_thai as TimelineDocument["trangThai"], validityNote: nullable(row.validity_note),
    sourceUrl: nullable(row.source_url), activeAt: started && !ended && !expiredByCurrentStatus,
  };
  const relationViews: TimelineRelation[] = relations.map((relation) => ({
    id: String(relation.id), direction: relation.direction as TimelineRelation["direction"],
    type: String(relation.relation_type), effectiveFrom: nullable(relation.effective_from), note: nullable(relation.note),
    document: { id: String(relation.related_id), soHieu: nullable(relation.related_so_hieu), trichYeu: nullable(relation.related_trich_yeu) },
    sourceUrl: String(relation.source_url),
  }));
  return NextResponse.json({ at, document, relations: relationViews });
}

function nullable(value: unknown): string | null { return value === null || value === undefined ? null : String(value); }
