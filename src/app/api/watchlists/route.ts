import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/client";
import { getOrCreateProfileId } from "@/lib/profile";
import { NEWS_TOPICS, type NewsTopic } from "@/types/news";
import type { WatchlistView } from "@/types/platform";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  topics: z.array(z.enum(NEWS_TOPICS)).min(1).max(10),
  documentIds: z.array(z.string().uuid()).max(50).default([]),
});

export async function GET() {
  const userId = await getOrCreateProfileId();
  const rows = await sql`SELECT * FROM watchlists WHERE user_id = ${userId} ORDER BY created_at DESC`;
  const views = await Promise.all(rows.map(async (row): Promise<WatchlistView> => ({
    id: String(row.id), name: String(row.name), topics: row.topics as NewsTopic[],
    documentIds: (row.document_ids as string[]) ?? [], lastSeenAt: new Date(String(row.last_seen_at)).toISOString(),
    alerts: await readAlerts(row.topics as string[], (row.document_ids as string[]) ?? [], String(row.last_seen_at)),
  })));
  return NextResponse.json(views);
}

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Danh sách theo dõi không hợp lệ." }, { status: 400 });
  const userId = await getOrCreateProfileId();
  const rows = await sql`
    INSERT INTO watchlists (user_id, name, topics, document_ids, last_seen_at)
    -- Mốc "đã xem" đặt tại thời điểm tạo, KHÔNG lùi 30 ngày. Lùi lại thì vừa
    -- bật theo dõi đã dội ngay một tháng tin cũ, và con số cập nhật thành
    -- nhiễu ngay từ giây đầu tiên thay vì báo cái mới.
    VALUES (${userId}, ${parsed.data.name}, ${parsed.data.topics}, ${parsed.data.documentIds}, now())
    RETURNING id`;
  return NextResponse.json({ id: String(rows[0].id) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Mã theo dõi không hợp lệ." }, { status: 400 });
  const userId = await getOrCreateProfileId();
  await sql`UPDATE watchlists SET last_seen_at = now(), updated_at = now() WHERE id = ${parsed.data.id} AND user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Mã theo dõi không hợp lệ." }, { status: 400 });
  const userId = await getOrCreateProfileId();
  await sql`DELETE FROM watchlists WHERE id = ${id} AND user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}

async function readAlerts(topics: string[], documentIds: string[], since: string): Promise<WatchlistView["alerts"]> {
  const [docs, news] = await Promise.all([
    sql`
      SELECT id, coalesce(so_hieu, trich_yeu, ten_file) AS title, coalesce(verified_at, created_at) AS at
      FROM documents
      WHERE (legal_topics && ${topics} OR id = ANY(${documentIds}::uuid[]))
        AND coalesce(verified_at, created_at) > ${since}::timestamptz
      ORDER BY at DESC LIMIT 10`,
    sql`
      SELECT id, title, coalesce(published_at, fetched_at) AS at FROM news_articles
      WHERE topics && ${topics} AND coalesce(published_at, fetched_at) > ${since}::timestamptz
      ORDER BY at DESC LIMIT 10`,
  ]);
  return [
    ...docs.map((row) => ({ id: String(row.id), kind: "document" as const, title: String(row.title), at: new Date(String(row.at)).toISOString(), href: `/documents/${row.id}` })),
    ...news.map((row) => ({ id: String(row.id), kind: "news" as const, title: String(row.title), at: new Date(String(row.at)).toISOString(), href: `/news?article=${row.id}` })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
}
