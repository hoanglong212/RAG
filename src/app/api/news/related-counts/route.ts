import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/client";
import { xepTheoLienQuan } from "@/lib/news/lien-quan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Đếm trước xem mỗi bài có báo khác cùng đưa tin hay không.
 *
 * Lý do tồn tại: đo trên corpus thật thì chỉ khoảng 7% bài có bài đối chiếu từ
 * tòa soạn khác — phần lớn tin chỉ một báo đưa. Nút "So sánh nguồn" hiện trên
 * mọi thẻ nên hơn chín trong mười lần bấm vào là gặp "chưa có bài nào đủ gần".
 * Người dùng kết luận tính năng chưa từng chạy, và họ kết luận đúng theo những
 * gì nhìn thấy.
 *
 * Biết trước thì nút chỉ hiện ở nơi nó làm được việc, và con số đi kèm biến nó
 * từ một lời mời thành một thông tin: "2 báo cùng đưa tin này" là điều đáng
 * biết về một bản tin, nhất là với người tra cứu pháp luật.
 */

const schema = z.object({ ids: z.array(z.string().uuid()).min(1).max(50) });

/** Cùng cửa sổ thời gian với /api/news/[id]/related — hai chỗ phải khớp nhau. */
const CUA_SO_NGAY = 3;

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Danh sách mã bài không hợp lệ." }, { status: 400 });
  }
  const { ids } = parsed.data;

  try {
    const goc = await sql`
      SELECT a.id, a.title, a.summary, s.homepage_url,
             coalesce(a.published_at, a.fetched_at) AS moc
      FROM news_articles a JOIN news_sources s ON s.id = a.source_id
      WHERE a.id = ANY(${ids}::uuid[])`;
    if (goc.length === 0) return NextResponse.json({});

    // Một lần lấy toàn bộ ứng viên trong cửa sổ, rồi chấm điểm tại chỗ. Gọi
    // một truy vấn cho mỗi bài sẽ thành 20 lượt đi lại chỉ để dựng xong trang.
    const moc = goc.map((g) => new Date(String(g.moc)).getTime());
    const som = new Date(Math.min(...moc) - CUA_SO_NGAY * 86_400_000).toISOString();
    const muon = new Date(Math.max(...moc) + CUA_SO_NGAY * 86_400_000).toISOString();

    const ungVien = await sql`
      SELECT a.id, a.title, a.summary, s.homepage_url,
             coalesce(a.published_at, a.fetched_at) AS moc
      FROM news_articles a JOIN news_sources s ON s.id = a.source_id
      WHERE coalesce(a.published_at, a.fetched_at) BETWEEN ${som}::timestamptz AND ${muon}::timestamptz
      LIMIT 2000`;

    const dem: Record<string, number> = {};
    for (const g of goc) {
      const tMoc = new Date(String(g.moc)).getTime();
      const trongTam = ungVien.filter(
        (u) =>
          String(u.homepage_url) !== String(g.homepage_url) &&
          Math.abs(new Date(String(u.moc)).getTime() - tMoc) <= CUA_SO_NGAY * 86_400_000,
      );
      dem[String(g.id)] = xepTheoLienQuan(
        {
          id: String(g.id),
          title: String(g.title),
          summary: g.summary === null ? null : String(g.summary),
        },
        trongTam.map((u) => ({
          id: String(u.id),
          title: String(u.title),
          summary: u.summary === null ? null : String(u.summary),
        })),
        6,
      ).length;
    }
    return NextResponse.json(dem);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đếm được bài liên quan." },
      { status: 500 },
    );
  }
}
