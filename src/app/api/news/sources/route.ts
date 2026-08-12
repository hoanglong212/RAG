import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { NEWS_TOPICS } from "@/types/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sources = await sql`
      SELECT s.id, s.slug, s.name, s.feed_url, s.homepage_url, s.enabled,
             s.last_fetched_at, s.last_error, count(a.id)::int AS article_count
      FROM news_sources s
      LEFT JOIN news_articles a ON a.source_id = s.id
      GROUP BY s.id
      ORDER BY s.name
    `;
    return NextResponse.json({ sources, topics: NEWS_TOPICS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đọc được nguồn tin." },
      { status: 500 },
    );
  }
}
