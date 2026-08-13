import { NextResponse } from "next/server";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  ilike,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { chunks, documents } from "@/lib/db/schema";
import type { DocumentSummary, LoaiVanBan } from "@/types/contract";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  loai: z
    .enum(["nghi_dinh", "thong_tu", "quyet_dinh", "luat", "nghi_quyet", "cong_van", "khac"])
    .optional(),
  coQuan: z.string().trim().min(1).optional(),
});

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tham số truy vấn không hợp lệ." }, { status: 400 });
  }

  // Contract danh sach khong co ingestStatus, vi vay chi tra cac ban ghi da
  // hoan tat; ban dang xu ly/loi neu lo ra se bien thanh the metadata rong.
  const filters: SQL[] = [eq(documents.ingest_status, "hoan_tat")];
  if (parsed.data.loai) filters.push(eq(documents.loai_van_ban, parsed.data.loai));
  if (parsed.data.coQuan) {
    filters.push(ilike(documents.co_quan_ban_hanh, `%${parsed.data.coQuan}%`));
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  try {
    const { db } = await import("@/lib/db/client");
    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: documents.id,
          soHieu: documents.so_hieu,
          loaiVanBan: documents.loai_van_ban,
          coQuan: documents.co_quan_ban_hanh,
          trichYeu: documents.trich_yeu,
          ngayBanHanh: documents.ngay_ban_hanh,
          ngayHieuLuc: documents.ngay_hieu_luc,
          trangThai: documents.trang_thai,
          parseWarnings: documents.parse_warnings,
          soDieu: countDistinct(chunks.dieu_so),
        })
        .from(documents)
        .leftJoin(chunks, eq(chunks.document_id, documents.id))
        .where(where)
        .groupBy(documents.id)
        .orderBy(desc(documents.created_at))
        .limit(parsed.data.pageSize)
        .offset((parsed.data.page - 1) * parsed.data.pageSize),
      db.select({ value: count() }).from(documents).where(where),
    ]);

    const items: DocumentSummary[] = rows.map((row) => ({
        id: row.id,
        soHieu: row.soHieu,
        loaiVanBan: normalizeDocumentType(row.loaiVanBan),
        coQuan: row.coQuan,
        trichYeu: row.trichYeu,
        ngayBanHanh: row.ngayBanHanh,
        ngayHieuLuc: row.ngayHieuLuc,
        trangThai: row.trangThai,
        soDieu: row.soDieu,
        coCanhBao: row.parseWarnings.length > 0,
      }));
    return NextResponse.json({
      items,
      total: totalRows[0]?.value ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đọc được danh sách văn bản." },
      { status: 500 },
    );
  }
}

function normalizeDocumentType(value: LoaiVanBan | null): LoaiVanBan {
  return value ?? "khac";
}
