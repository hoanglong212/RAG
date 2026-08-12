import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const rows = await sql`
      SELECT a.id, a.title, a.summary, a.url, a.image_url, a.published_at,
             a.topics, a.keywords, a.locations,
             s.slug AS source_slug, s.name AS source_name, s.homepage_url
      FROM news_articles a
      JOIN news_sources s ON s.id = a.source_id
      WHERE a.id::text = ${id}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Không tìm thấy bài tin." }, { status: 404 });
    return NextResponse.json({
      id: row.id,
      source: { slug: row.source_slug, name: row.source_name, homepageUrl: row.homepage_url },
      title: row.title,
      summary: row.summary,
      url: row.url,
      imageUrl: row.image_url,
      publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
      topics: row.topics,
      keywords: row.keywords,
      locations: row.locations,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đọc được bài tin." },
      { status: 500 },
    );
  }
}
