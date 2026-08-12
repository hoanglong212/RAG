import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import type { LoaiVanBan, StatsResponse } from "@/types/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const threshold = readThreshold();
    const [summaryRows, typeRows, agencyRows, yearRows, scoreRows, lowRows, qualityRows] =
      await Promise.all([
        sql`
          SELECT count(*)::int AS total_documents,
                 (SELECT count(*)::int FROM chunks) AS total_chunks,
                 coalesce(avg((jsonb_array_length(parse_warnings) = 0)::int), 0)::float8 AS clean_ratio
          FROM documents
          WHERE ingest_status = 'hoan_tat'
        `,
        sql`
          SELECT coalesce(loai_van_ban, 'khac') AS document_type, count(*)::int AS total
          FROM documents
          WHERE ingest_status = 'hoan_tat'
          GROUP BY coalesce(loai_van_ban, 'khac')
          ORDER BY total DESC
        `,
        sql`
          SELECT coalesce(co_quan_ban_hanh, 'Chưa xác định') AS agency, count(*)::int AS total
          FROM documents
          WHERE ingest_status = 'hoan_tat'
          GROUP BY coalesce(co_quan_ban_hanh, 'Chưa xác định')
          ORDER BY total DESC, agency
        `,
        sql`
          SELECT extract(year FROM ngay_ban_hanh)::int AS year, count(*)::int AS total
          FROM documents
          WHERE ingest_status = 'hoan_tat' AND ngay_ban_hanh IS NOT NULL
          GROUP BY extract(year FROM ngay_ban_hanh)
          ORDER BY year
        `,
        sql`
          SELECT bucket, count(*)::int AS total
          FROM (
            SELECT CASE
                     WHEN diem_cao_nhat < 0.35 THEN '<0.35'
                     WHEN diem_cao_nhat < 0.50 THEN '0.35–0.49'
                     WHEN diem_cao_nhat < 0.70 THEN '0.50–0.69'
                     ELSE '≥0.70'
                   END AS bucket
            FROM truy_van
            WHERE diem_cao_nhat IS NOT NULL
          ) scores
          GROUP BY bucket
          ORDER BY min(CASE bucket WHEN '<0.35' THEN 1 WHEN '0.35–0.49' THEN 2 WHEN '0.50–0.69' THEN 3 ELSE 4 END)
        `,
        sql`
          SELECT cau_hoi AS question, diem_cao_nhat::float8 AS top_score, created_at
          FROM truy_van
          WHERE diem_cao_nhat < ${threshold}
          ORDER BY created_at DESC
          LIMIT 10
        `,
        sql`
          SELECT coalesce(percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms), 0)::float8 AS p50,
                 coalesce(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::float8 AS p95,
                 coalesce(avg(co_trich_dan::int), 0)::float8 AS citation_ratio
          FROM truy_van
          WHERE latency_ms IS NOT NULL
        `,
      ]);

    const summary = summaryRows[0];
    const quality = qualityRows[0];
    const response: StatsResponse = {
      tongVanBan: Number(summary?.total_documents ?? 0),
      tongChunk: Number(summary?.total_chunks ?? 0),
      theoLoai: typeRows.map((row) => ({
        loai: normalizeType(String(row.document_type)),
        soLuong: Number(row.total),
      })),
      theoCoQuan: agencyRows.map((row) => ({
        coQuan: String(row.agency),
        soLuong: Number(row.total),
      })),
      theoNam: yearRows.map((row) => ({ nam: Number(row.year), soLuong: Number(row.total) })),
      sapHetHieuLuc: [],
      tyLeParseSach: Number(summary?.clean_ratio ?? 0),
      phanBoScore: scoreRows.map((row) => ({
        khoang: String(row.bucket),
        soLuong: Number(row.total),
      })),
      cauHoiDiemThap: lowRows.map((row) => ({
        question: String(row.question),
        topScore: Number(row.top_score),
        at: new Date(String(row.created_at)).toISOString(),
      })),
      latencyP50: Math.round(Number(quality?.p50 ?? 0)),
      latencyP95: Math.round(Number(quality?.p95 ?? 0)),
      tyLeCoTrichDan: Number(quality?.citation_ratio ?? 0),
    };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đọc được thống kê." },
      { status: 500 },
    );
  }
}

function normalizeType(value: string): LoaiVanBan {
  return ["nghi_dinh", "thong_tu", "quyet_dinh", "luat", "nghi_quyet", "cong_van"].includes(
    value,
  )
    ? (value as LoaiVanBan)
    : "khac";
}

function readThreshold(): number {
  const value = Number(process.env.NGUONG_DIEM_TOI_THIEU ?? "0.35");
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.35;
}
