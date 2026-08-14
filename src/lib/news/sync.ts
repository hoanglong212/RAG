import { createHash } from "node:crypto";
import type postgres from "postgres";
import { parseNewsFeed } from "./rss";
import { DEFAULT_NEWS_SOURCES, type ConfiguredNewsSource } from "./sources";

export interface NewsSyncResult {
  source: string;
  status: "ok" | "error";
  fetched: number;
  inserted: number;
  updated: number;
  error: string | null;
}

interface SourceRow { id: string }

export async function syncAllNewsSources(
  sql: postgres.Sql,
  sources: readonly ConfiguredNewsSource[] = DEFAULT_NEWS_SOURCES,
): Promise<NewsSyncResult[]> {
  const results: NewsSyncResult[] = [];
  for (const source of sources) results.push(await syncNewsSource(sql, source));
  return results;
}

export async function syncNewsSource(
  sql: postgres.Sql,
  source: ConfiguredNewsSource,
  fetcher: typeof fetch = fetch,
): Promise<NewsSyncResult> {
  const [sourceRow] = await sql<SourceRow[]>`
    INSERT INTO news_sources (slug, name, feed_url, homepage_url)
    VALUES (${source.slug}, ${source.name}, ${source.feedUrl}, ${source.homepageUrl})
    ON CONFLICT (slug) DO UPDATE SET
      name = excluded.name,
      feed_url = excluded.feed_url,
      homepage_url = excluded.homepage_url,
      updated_at = now()
    RETURNING id
  `;
  if (!sourceRow) throw new Error(`Không tạo được nguồn ${source.slug}.`);
  const [run] = await sql<{ id: string }[]>`
    INSERT INTO news_sync_runs (source_id, status)
    VALUES (${sourceRow.id}, 'running')
    RETURNING id
  `;
  if (!run) throw new Error(`Không tạo được sync run cho ${source.slug}.`);

  let fetched = 0;
  let inserted = 0;
  let updated = 0;
  try {
    const response = await fetcher(source.feedUrl, {
      headers: {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
        "user-agent": "LegalNewsMonitor/1.0 (+RSS metadata reader)",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`RSS trả HTTP ${response.status}.`);
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > 5_000_000) throw new Error("RSS vượt giới hạn 5 MB.");
    const xml = await response.text();
    if (xml.length > 5_000_000) throw new Error("RSS vượt giới hạn 5 MB.");
    const items = parseNewsFeed(xml);
    fetched = items.length;

    for (const item of items) {
      const externalId = createHash("sha256").update(item.url).digest("hex");
      const [row] = await sql<{ inserted: boolean }[]>`
        INSERT INTO news_articles (
          source_id, external_id, url, title, summary, image_url,
          published_at, topics, keywords, locations
        ) VALUES (
          ${sourceRow.id}, ${externalId}, ${item.url}, ${item.title}, ${item.summary},
          ${item.imageUrl}, ${item.publishedAt?.toISOString() ?? null}::timestamptz,
          ${item.topics}, ${item.keywords}, ${item.locations}
        )
        -- Xung đột theo external_id (hash của URL) chứ không theo cặp với
        -- source_id: cùng một bài về qua hai feed chuyên mục của cùng tòa soạn
        -- vẫn là MỘT bài. Không cập nhật source_id ở đây — giữ nơi thấy đầu
        -- tiên, vì đổi qua đổi lại mỗi lần đồng bộ chỉ làm nhiễu.
        ON CONFLICT (external_id) DO UPDATE SET
          url = excluded.url,
          title = excluded.title,
          summary = excluded.summary,
          image_url = excluded.image_url,
          published_at = excluded.published_at,
          topics = excluded.topics,
          keywords = excluded.keywords,
          locations = excluded.locations,
          fetched_at = now(),
          updated_at = now()
        RETURNING (xmax = 0) AS inserted
      `;
      if (row?.inserted) inserted += 1;
      else updated += 1;
    }

    await sql.begin(async (transaction) => {
      await transaction`
        UPDATE news_sources
        SET last_fetched_at = now(), last_error = NULL, updated_at = now()
        WHERE id = ${sourceRow.id}
      `;
      await transaction`
        UPDATE news_sync_runs
        SET status = 'ok', fetched_count = ${fetched}, inserted_count = ${inserted},
            updated_count = ${updated}, finished_at = now()
        WHERE id = ${run.id}
      `;
    });
    return { source: source.slug, status: "ok", fetched, inserted, updated, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi đồng bộ không xác định.";
    await sql.begin(async (transaction) => {
      await transaction`
        UPDATE news_sources SET last_error = ${message}, updated_at = now()
        WHERE id = ${sourceRow.id}
      `;
      await transaction`
        UPDATE news_sync_runs
        SET status = 'error', fetched_count = ${fetched}, inserted_count = ${inserted},
            updated_count = ${updated}, error = ${message}, finished_at = now()
        WHERE id = ${run.id}
      `;
    });
    return { source: source.slug, status: "error", fetched, inserted, updated, error: message };
  }
}
