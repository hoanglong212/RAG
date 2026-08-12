import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  const [summary, warningDocs, staleDocs, sources, lowQueries] = await Promise.all([
    sql`
      SELECT count(*)::int AS documents,
             count(*) FILTER (WHERE jsonb_array_length(parse_warnings) > 0)::int AS warning_documents,
             count(*) FILTER (WHERE verified_at IS NULL)::int AS unverified_documents,
             count(*) FILTER (WHERE NOT retrieval_enabled)::int AS disabled_documents
      FROM documents`,
    sql`
      SELECT id, so_hieu, trich_yeu, jsonb_array_length(parse_warnings)::int AS warning_count
      FROM documents WHERE jsonb_array_length(parse_warnings) > 0
      ORDER BY warning_count DESC LIMIT 20`,
    sql`
      SELECT id, so_hieu, trich_yeu, verified_at FROM documents
      WHERE verified_at IS NULL OR verified_at < now() - interval '180 days'
      ORDER BY verified_at NULLS FIRST LIMIT 20`,
    sql`
      SELECT id, name, enabled, last_fetched_at, last_error,
             (SELECT count(*)::int FROM news_articles a WHERE a.source_id = s.id) AS article_count
      FROM news_sources s ORDER BY name`,
    sql`
      SELECT cau_hoi, diem_cao_nhat, created_at FROM truy_van
      WHERE diem_cao_nhat IS NULL OR diem_cao_nhat < 0.35
      ORDER BY created_at DESC LIMIT 20`,
  ]);
  return NextResponse.json({ summary: summary[0], warningDocs, staleDocs, sources, lowQueries });
}
