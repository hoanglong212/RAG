import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const articles = await sql`SELECT id, source_id, topics, keywords, published_at FROM news_articles WHERE id::text = ${id} LIMIT 1`;
  const article = articles[0];
  if (!article) return NextResponse.json({ error: "Không tìm thấy bài tin." }, { status: 404 });
  const rows = await sql`
    SELECT a.id, a.title, a.summary, a.url, a.published_at, a.topics, s.slug AS source_slug, s.name AS source_name
    FROM news_articles a JOIN news_sources s ON s.id = a.source_id
    WHERE a.id <> ${id}::uuid
      AND (a.topics && ${article.topics as string[]} OR a.keywords && ${article.keywords as string[]})
    ORDER BY
      CASE WHEN a.source_id <> ${article.source_id} THEN 0 ELSE 1 END,
      abs(extract(epoch from (coalesce(a.published_at, a.fetched_at) - ${article.published_at ?? new Date().toISOString()}::timestamptz)))
    LIMIT 8`;
  return NextResponse.json(rows.map((row) => ({
    id: String(row.id), title: String(row.title), summary: row.summary ? String(row.summary) : null,
    url: String(row.url), publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    topics: row.topics, source: { slug: String(row.source_slug), name: String(row.source_name) },
  })));
}
