"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import type { LegalCheckResult } from "@/lib/legal/check";
import { NEWS_TOPICS, type NewsArticleSummary, type NewsTopic } from "@/types/news";
import { NHAN_CHU_DE_TIN, NHAN_KET_QUA_PHAP_LY } from "@/types/nhan-news";

interface NewsResponse {
  items: NewsArticleSummary[];
  total: number;
}

interface NewsSource {
  slug: string;
  name: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  publishedAt: string | null;
  source: NewsSource;
}

export default function TrangTinTuc() {
  const router = useRouter();
  const [data, setData] = useState<NewsResponse>({ items: [], total: 0 });
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<NewsTopic | "">("");
  const [source, setSource] = useState("");
  const [filters, setFilters] = useState<{ q: string; topic: NewsTopic | ""; source: string }>({
    q: "",
    topic: "",
    source: "",
  });
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [check, setCheck] = useState<{ articleId: string; result: LegalCheckResult } | null>(null);
  const [related, setRelated] = useState<{ articleId: string; items: RelatedArticle[] } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoi(null);
    const params = new URLSearchParams({ pageSize: "20" });
    if (filters.q) params.set("q", filters.q);
    if (filters.topic) params.set("topic", filters.topic);
    if (filters.source) params.set("source", filters.source);
    try {
      const response = await fetch(`/api/news?${params}`);
      const result = (await response.json()) as NewsResponse | { error?: string };
      if (!response.ok) throw new Error("error" in result ? result.error : "Không đọc được tin tức.");
      setData(result as NewsResponse);
    } catch (error) {
      setLoi(error instanceof Error ? error.message : "Không đọc được tin tức.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetch("/api/news/sources")
      .then(async (response) => {
        const result = (await response.json()) as { sources?: NewsSource[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Không đọc được nguồn tin.");
        setSources(result.sources ?? []);
      })
      .catch((error: unknown) => setLoi(error instanceof Error ? error.message : "Không đọc được nguồn tin."));
  }, []);

  useEffect(() => void load(), [load]);

  async function doiChieu(articleId: string) {
    setCheckingId(articleId);
    setCheck(null);
    setLoi(null);
    try {
      const response = await fetch(`/api/news/${encodeURIComponent(articleId)}/legal-check`, {
        method: "POST",
      });
      const result = (await response.json()) as LegalCheckResult | { error?: string };
      if (!response.ok) throw new Error("error" in result ? result.error : "Không đối chiếu được bài tin.");
      setCheck({ articleId, result: result as LegalCheckResult });
    } catch (error) {
      setLoi(error instanceof Error ? error.message : "Không đối chiếu được bài tin.");
    } finally {
      setCheckingId(null);
    }
  }

  async function timTinLienQuan(articleId: string) {
    setCheckingId(articleId);
    try {
      const response = await fetch(`/api/news/${encodeURIComponent(articleId)}/related`);
      const result = (await response.json()) as RelatedArticle[] | { error?: string };
      if (!response.ok) throw new Error("error" in result ? result.error : "Không tìm được tin liên quan.");
      setRelated({ articleId, items: result as RelatedArticle[] });
    } catch (error) {
      setLoi(error instanceof Error ? error.message : "Không tìm được tin liên quan.");
    } finally {
      setCheckingId(null);
    }
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-lg font-semibold">Tin tức và pháp luật</h1>
        <p className="mt-1 text-sm text-nhan">
          Tin được lấy từ RSS, chỉ lưu tiêu đề, tóm tắt và liên kết về bài gốc.
        </p>

        <form
          className="mt-4 grid gap-2 rounded-[--bo-lon] bg-giay p-3 md:grid-cols-[1fr_12rem_12rem_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters({ q: q.trim(), topic, source });
          }}
        >
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Tìm trong tiêu đề và tóm tắt"
            className="rounded-[--bo] bg-khay px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-but-xanh/30"
          />
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value as NewsTopic | "")}
            className="rounded-[--bo] bg-khay px-3 py-2 text-sm"
          >
            <option value="">Mọi chủ đề</option>
            {NEWS_TOPICS.map((item) => <option key={item} value={item}>{NHAN_CHU_DE_TIN[item]}</option>)}
          </select>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="rounded-[--bo] bg-khay px-3 py-2 text-sm"
          >
            <option value="">Mọi nguồn</option>
            {sources.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
          <button type="submit" className="rounded-[--bo] bg-but-xanh px-4 py-2 text-sm font-medium text-giay">
            Lọc tin
          </button>
        </form>

        {loi ? <p className="mt-3 rounded-[--bo] bg-khay-sau px-3 py-2 text-sm text-dau-do">{loi}</p> : null}
        {loading ? <p className="mt-6 text-sm text-nhan">Đang đọc nguồn tin…</p> : null}
        {!loading ? <p className="mt-4 text-xs text-nhan">Tìm thấy {data.total} bài tin.</p> : null}

        <div className="mt-3 flex flex-col gap-3 pb-8">
          {data.items.map((article) => (
            <article key={article.id} className="rounded-[--bo-lon] bg-giay p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-nhan">
                <span className="font-medium text-muc-in">{article.source.name}</span>
                {article.publishedAt ? <time>{new Date(article.publishedAt).toLocaleString("vi-VN")}</time> : null}
              </div>
              <h2 className="mt-2 text-base font-semibold leading-snug">
                <a href={article.url} target="_blank" rel="noreferrer" className="hover:text-but-xanh hover:underline">
                  {article.title}
                </a>
              </h2>
              {article.summary ? <p className="mt-2 text-sm leading-relaxed text-nhan">{article.summary}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {article.topics.map((item) => (
                  <span key={item} className="rounded-[--bo] bg-khay px-2 py-1 text-xs text-nhan">
                    {NHAN_CHU_DE_TIN[item]}
                  </span>
                ))}
                <button
                  type="button"
                  disabled={checkingId === article.id}
                  onClick={() => void timTinLienQuan(article.id)}
                  className="ml-auto rounded-[--bo] border border-ke-mo px-3 py-1.5 text-xs font-medium text-nhan disabled:opacity-50"
                >
                  So sánh nhiều nguồn
                </button>
                <button
                  type="button"
                  disabled={checkingId === article.id}
                  onClick={() => void doiChieu(article.id)}
                  className="rounded-[--bo] border border-but-xanh/30 px-3 py-1.5 text-xs font-medium text-but-xanh disabled:opacity-50"
                >
                  {checkingId === article.id ? "Đang đối chiếu…" : "Đối chiếu pháp luật"}
                </button>
              </div>

              {related?.articleId === article.id ? (
                <section className="mt-4 border-t border-ke-mo pt-4">
                  <h3 className="nhan-hoa">Tin cùng chủ đề hoặc từ khóa</h3>
                  {related.items.length > 0 ? (
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {related.items.map((item) => (
                        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="rounded-[--bo] bg-khay p-3 hover:bg-khay-sau">
                          <span className="block text-xs font-medium text-nhan">{item.source.name}</span>
                          <span className="mt-1 block text-sm font-medium leading-snug">{item.title}</span>
                        </a>
                      ))}
                    </div>
                  ) : <p className="mt-2 text-sm text-nhan">Chưa có bài từ nguồn khác đủ gần.</p>}
                </section>
              ) : null}

              {check?.articleId === article.id ? (
                <section className="mt-4 border-t border-ke-mo pt-4">
                  <p className="text-sm font-semibold">{NHAN_KET_QUA_PHAP_LY[check.result.status]}</p>
                  {check.result.answer ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{check.result.answer}</p> : null}
                  {check.result.citations.length > 0 ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {check.result.citations.map((citation, index) => (
                        <ChipTrichDan
                          key={citation.chunkId}
                          trichDan={citation}
                          soThuTu={index + 1}
                          onChon={() => router.push(`/documents/${citation.documentId}?node=${citation.nodeId}`)}
                        />
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs leading-relaxed text-nhan">{check.result.disclaimer}</p>
                </section>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
