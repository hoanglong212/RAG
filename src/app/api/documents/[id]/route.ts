import { NextResponse } from "next/server";
import { countDistinct, eq } from "drizzle-orm";
import { z } from "zod";
import { chunks, doc_nodes, documents } from "@/lib/db/schema";
import { toContractWarnings } from "@/lib/ingest/warnings";
import type { DocNode, DocumentDetail, LoaiVanBan } from "@/types/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Mã văn bản không hợp lệ." }, { status: 400 });
  }

  try {
    const { db } = await import("@/lib/db/client");
    const [documentRows, nodeRows, articleCounts] = await Promise.all([
      db.select().from(documents).where(eq(documents.id, id)).limit(1),
      db
        .select({
          id: doc_nodes.id,
          parentId: doc_nodes.parent_id,
          type: doc_nodes.node_type,
          soThuTu: doc_nodes.so_thu_tu,
          tieuDe: doc_nodes.tieu_de,
          noiDung: doc_nodes.noi_dung,
          breadcrumb: doc_nodes.breadcrumb,
          orderIndex: doc_nodes.order_index,
        })
        .from(doc_nodes)
        .where(eq(doc_nodes.document_id, id))
        .orderBy(doc_nodes.order_index),
      db
        .select({ value: countDistinct(chunks.dieu_so) })
        .from(chunks)
        .where(eq(chunks.document_id, id)),
    ]);

    const row = documentRows[0];
    if (!row) {
      return NextResponse.json({ error: "Không tìm thấy văn bản." }, { status: 404 });
    }

    const nodes = new Map<string, DocNode>();
    for (const node of nodeRows) {
      nodes.set(node.id, {
        id: node.id,
        type: node.type,
        soThuTu: node.soThuTu ?? "",
        tieuDe: node.tieuDe,
        noiDung: node.noiDung,
        breadcrumb: node.breadcrumb,
        children: [],
      });
    }

    const tree: DocNode[] = [];
    for (const node of nodeRows) {
      const current = nodes.get(node.id);
      if (!current) continue;
      const parent = node.parentId ? nodes.get(node.parentId) : undefined;
      if (parent) parent.children.push(current);
      else tree.push(current);
    }

    const detail: DocumentDetail = {
      id: row.id,
      soHieu: row.so_hieu,
      loaiVanBan: normalizeDocumentType(row.loai_van_ban),
      coQuan: row.co_quan_ban_hanh,
      trichYeu: row.trich_yeu,
      ngayBanHanh: row.ngay_ban_hanh,
      ngayHieuLuc: row.ngay_hieu_luc,
      trangThai: row.trang_thai,
      soDieu: articleCounts[0]?.value ?? 0,
      coCanhBao: row.parse_warnings.length > 0,
      tree,
      warnings: toContractWarnings(row.parse_warnings),
    };

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đọc được văn bản." },
      { status: 500 },
    );
  }
}

function normalizeDocumentType(value: LoaiVanBan | null): LoaiVanBan {
  return value ?? "khac";
}
