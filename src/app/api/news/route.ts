import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/client";
import { NEWS_TOPICS, type NewsArticleSummary } from "@/types/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  topic: z.enum(NEWS_TOPICS).optional(),
  source: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(200).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Tham số lọc tin tức không hợp lệ." }, { status: 400 });
  }
  const { page, pageSize, topic, source, q, from, to } = parsed.data;
  const fromIso = from?.toISOString() ?? null;
  const toIso = to?.toISOString() ?? null;
  try {
    const [rows, countRows] = await Promise.all([
      sql`
        SELECT a.id, a.title, a.summary, a.url, a.image_url, a.published_at,
               a.topics, a.keywords, a.locations,
               s.slug AS source_slug, s.name AS source_name, s.homepage_url
        FROM news_articles a
        JOIN news_sources s ON s.id = a.source_id
        WHERE (${topic ?? null}::text IS NULL OR ${topic ?? null}::text = ANY(a.topics))
          AND (${source ?? null}::text IS NULL OR s.slug = ${source ?? null}::text)
          AND (${q ?? null}::text IS NULL OR f_unaccent(a.title || ' ' || coalesce(a.summary, '')) ILIKE '%' || f_unaccent(${q ?? null}::text) || '%')
          AND (${fromIso}::timestamptz IS NULL OR a.published_at >= ${fromIso}::timestamptz)
          AND (${toIso}::timestamptz IS NULL OR a.published_at <= ${toIso}::timestamptz)
        ORDER BY a.published_at DESC NULLS LAST, a.fetched_at DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `,
      sql`
        SELECT count(*)::int AS total
        FROM news_articles a
        JOIN news_sources s ON s.id = a.source_id
        WHERE (${topic ?? null}::text IS NULL OR ${topic ?? null}::text = ANY(a.topics))
          AND (${source ?? null}::text IS NULL OR s.slug = ${source ?? null}::text)
          AND (${q ?? null}::text IS NULL OR f_unaccent(a.title || ' ' || coalesce(a.summary, '')) ILIKE '%' || f_unaccent(${q ?? null}::text) || '%')
          AND (${fromIso}::timestamptz IS NULL OR a.published_at >= ${fromIso}::timestamptz)
          AND (${toIso}::timestamptz IS NULL OR a.published_at <= ${toIso}::timestamptz)
      `,
    ]);
    const items: NewsArticleSummary[] = rows.map((row) => ({
      id: String(row.id),
      source: {
        slug: String(row.source_slug),
        name: String(row.source_name),
        homepageUrl: String(row.homepage_url),
      },
      title: String(row.title),
      summary: row.summary === null ? null : String(row.summary),
      url: String(row.url),
      imageUrl: row.image_url === null ? null : String(row.image_url),
      publishedAt: row.published_at === null ? null : new Date(String(row.published_at)).toISOString(),
      topics: row.topics as NewsArticleSummary["topics"],
      keywords: row.keywords as string[],
      locations: row.locations as string[],
    }));
    return NextResponse.json({ items, total: Number(countRows[0]?.total ?? 0), page, pageSize });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đọc được tin tức." },
      { status: 500 },
    );
  }
}
