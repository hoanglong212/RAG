import { NextResponse } from "next/server";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { chunks, documents } from "@/lib/db/schema";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  loai: z
    .enum(["nghi_dinh", "thong_tu", "quyet_dinh", "luat", "nghi_quyet", "cong_van", "khac"])
    .optional(),
  coQuan: z.string().trim().min(1).optional(),
});

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tham số truy vấn không hợp lệ." }, { status: 400 });
  }

  const filters: SQL[] = [];
  if (parsed.data.loai) filters.push(documentTypeFilter(parsed.data.loai));
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
          loiChiTiet: documents.loi_chi_tiet,
          soDieu: countDistinct(chunks.dieu_so),
        })
        .from(documents)
        .leftJoin(chunks, eq(chunks.document_id, documents.id))
        .where(where)
        .groupBy(documents.id)
        .orderBy(desc(documents.created_at))
        .limit(PAGE_SIZE)
        .offset((parsed.data.page - 1) * PAGE_SIZE),
      db.select({ value: count() }).from(documents).where(where),
    ]);

    return NextResponse.json({
      items: rows.map((row) => ({
        id: row.id,
        soHieu: row.soHieu,
        loaiVanBan: normalizeDocumentType(row.loaiVanBan),
        coQuan: row.coQuan,
        trichYeu: row.trichYeu,
        ngayBanHanh: row.ngayBanHanh,
        ngayHieuLuc: row.ngayHieuLuc,
        trangThai: "chua_xac_dinh" as const,
        soDieu: row.soDieu,
        coCanhBao: row.loiChiTiet !== null,
      })),
      total: totalRows[0]?.value ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đọc được danh sách văn bản." },
      { status: 500 },
    );
  }
}

function normalizeDocumentType(value: string | null) {
  const types: Record<string, string> = {
    "Nghị định": "nghi_dinh",
    "Thông tư": "thong_tu",
    "Thông tư liên tịch": "thong_tu",
    "Quyết định": "quyet_dinh",
    Luật: "luat",
    "Nghị quyết": "nghi_quyet",
    "Công văn": "cong_van",
  };
  return value ? (types[value] ?? "khac") : "khac";
}

const DATABASE_TYPES = [
  "Nghị định",
  "Thông tư",
  "Thông tư liên tịch",
  "Quyết định",
  "Luật",
  "Nghị quyết",
  "Công văn",
] as const;

function documentTypeFilter(value: z.infer<typeof querySchema>["loai"]): SQL {
  switch (value) {
    case "nghi_dinh":
      return eq(documents.loai_van_ban, "Nghị định");
    case "thong_tu":
      return inArray(documents.loai_van_ban, ["Thông tư", "Thông tư liên tịch"]);
    case "quyet_dinh":
      return eq(documents.loai_van_ban, "Quyết định");
    case "luat":
      return eq(documents.loai_van_ban, "Luật");
    case "nghi_quyet":
      return eq(documents.loai_van_ban, "Nghị quyết");
    case "cong_van":
      return eq(documents.loai_van_ban, "Công văn");
    case "khac":
      return or(
        isNull(documents.loai_van_ban),
        notInArray(documents.loai_van_ban, [...DATABASE_TYPES]),
      ) as SQL;
    default:
      return isNull(documents.loai_van_ban);
  }
}
