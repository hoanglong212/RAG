import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { xepTheoLienQuan } from "@/lib/news/lien-quan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "So sánh nguồn": các báo KHÁC viết gì về CÙNG sự việc này.
 *
 * Bản cũ lọc bằng `a.topics && b.topics OR a.keywords && b.keywords` rồi xếp
 * theo khoảng cách thời gian. Đo trên dữ liệu thật thì cách đó vô hiệu: 120
 * trong 267 bài mang đúng chủ đề "khac" và có keywords rỗng, nên điều kiện rút
 * gọn thành "bài nào cũng khớp" và thứ tự cuối cùng chỉ là "đăng gần giờ nhất".
 * Bài về Trump kháng cáo lên Tòa Tối cao trả về Park Hang Seo và billiards.
 *
 * Giờ SQL chỉ còn lo phần nó làm tốt — thu hẹp ứng viên theo nguồn khác và cửa
 * sổ thời gian — còn việc xét có cùng sự việc hay không do một hàm thuần trong
 * lib/news/lien-quan.ts đảm nhiệm, nơi kiểm thử được bằng chính tám kết quả
 * sai đã gặp.
 */

/** Một sự việc được các báo đưa trong vòng vài ngày, không phải vài tuần. */
const CUA_SO_NGAY = 3;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const articles = await sql`
    SELECT id, source_id, title, summary, coalesce(published_at, fetched_at) AS moc
    FROM news_articles WHERE id::text = ${id} LIMIT 1`;
  const article = articles[0];
  if (!article) return NextResponse.json({ error: "Không tìm thấy bài tin." }, { status: 404 });

  const moc = new Date(String(article.moc)).toISOString();

  /*
   * Bắt buộc KHÁC NGUỒN, không phải chỉ ưu tiên như trước. Tính năng tên là
   * "so sánh nguồn"; trả về bài của chính tờ báo đó không trả lời được câu hỏi
   * người dùng đang hỏi.
   */
  const ungVien = await sql`
    SELECT a.id, a.title, a.summary, a.url, a.published_at, a.topics,
           s.slug AS source_slug, s.name AS source_name
    FROM news_articles a
    JOIN news_sources s ON s.id = a.source_id
    WHERE a.id <> ${id}::uuid
      AND a.source_id <> ${article.source_id}::uuid
      AND coalesce(a.published_at, a.fetched_at)
            BETWEEN ${moc}::timestamptz - ${`${CUA_SO_NGAY} days`}::interval
                AND ${moc}::timestamptz + ${`${CUA_SO_NGAY} days`}::interval
    LIMIT 400`;

  const xep = xepTheoLienQuan(
    {
      id: String(article.id),
      title: String(article.title),
      summary: article.summary === null ? null : String(article.summary),
    },
    ungVien.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      summary: row.summary === null ? null : String(row.summary),
      row,
    })),
    6,
  );

  return NextResponse.json(
    xep.map(({ bai, diem }) => {
      const row = bai.row;
      return {
        id: String(row.id),
        title: String(row.title),
        summary: row.summary === null ? null : String(row.summary),
        url: String(row.url),
        publishedAt: row.published_at
          ? new Date(String(row.published_at)).toISOString()
          : null,
        topics: row.topics,
        source: { slug: String(row.source_slug), name: String(row.source_name) },
        // Điểm đi kèm để giao diện nói được "gần tới đâu" thay vì chỉ liệt kê.
        diemLienQuan: Number(diem.toFixed(3)),
      };
    }),
  );
}
