import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { NEWS_TOPICS, type NewsTopic } from "@/types/news";
import type { CoverageRow } from "@/types/platform";

export const runtime = "nodejs";

export async function GET() {
  const rows = await sql`
    WITH topics AS (SELECT unnest(${NEWS_TOPICS as unknown as string[]}::text[]) AS topic),
    doc_stats AS (
      SELECT topic, count(*)::int AS documents,
             count(*) FILTER (WHERE retrieval_enabled)::int AS enabled_documents,
             count(*) FILTER (WHERE verified_at IS NOT NULL)::int AS verified_documents,
             count(*) FILTER (WHERE jsonb_array_length(parse_warnings) > 0)::int AS warning_documents,
             max(verified_at) AS last_verified_at
      FROM documents, unnest(legal_topics) topic GROUP BY topic
    ),
    chunk_stats AS (
      SELECT topic, count(DISTINCT c.id)::int AS chunks
      FROM documents d
      JOIN chunks c ON c.document_id = d.id AND c.strategy = 'structural'
      CROSS JOIN LATERAL unnest(d.legal_topics) topic
      GROUP BY topic
    )
    SELECT t.topic, coalesce(d.documents, 0) AS documents, coalesce(c.chunks, 0) AS chunks,
           coalesce(d.enabled_documents, 0) AS enabled_documents,
           coalesce(d.verified_documents, 0) AS verified_documents,
           coalesce(d.warning_documents, 0) AS warning_documents, d.last_verified_at
    FROM topics t LEFT JOIN doc_stats d ON d.topic = t.topic LEFT JOIN chunk_stats c ON c.topic = t.topic
    ORDER BY documents DESC, t.topic`;
  const result: CoverageRow[] = rows.map((row) => ({
    topic: row.topic as NewsTopic, documents: Number(row.documents), chunks: Number(row.chunks),
    enabledDocuments: Number(row.enabled_documents), verifiedDocuments: Number(row.verified_documents),
    warningDocuments: Number(row.warning_documents),
    lastVerifiedAt: row.last_verified_at ? new Date(String(row.last_verified_at)).toISOString() : null,
  }));
  return NextResponse.json(result);
}
