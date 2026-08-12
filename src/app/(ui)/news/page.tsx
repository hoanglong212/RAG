"use client";

/**
 * Tin tức và pháp luật.
 *
 * Mỗi bài tin là một thẻ giấy trên khay. Hai hành động của bài — so sánh nhiều
 * nguồn và đối chiếu pháp luật — nằm ở chân thẻ và kết quả mở ra NGAY TRONG
 * thẻ đó, không đẩy sang trang khác: người đọc đang so tin với luật thì phải
 * thấy cả hai cùng lúc.
 *
 * Chủ đề dùng viên lọc thay cho thẻ select vì tập lựa chọn ngắn và người dùng
 * cần thấy ngay mình đang lọc theo gì.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { KhungTrang, Nhan, Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { OChon, ONhap, VienLoc } from "@/components/kit/truong";
import { BaoLoi, TrongRong, XuongDanhSach } from "@/components/kit/trang-thai-kit";
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
  const [nguon, setNguon] = useState<NewsSource[]>([]);
  const [q, setQ] = useState("");
  const [chuDe, setChuDe] = useState<NewsTopic | "">("");
  const [slugNguon, setSlugNguon] = useState("");
  const [loc, setLoc] = useState<{ q: string; chuDe: NewsTopic | ""; nguon: string }>({
    q: "",
    chuDe: "",
    nguon: "",
  });
  const [dangTai, setDangTai] = useState(true);
  const [dangChay, setDangChay] = useState<string | null>(null);
  const [doiChieuKq, setDoiChieuKq] = useState<{ id: string; kq: LegalCheckResult } | null>(null);
  const [lienQuan, setLienQuan] = useState<{ id: string; items: RelatedArticle[] } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const doc = useCallback(async () => {
    setDangTai(true);
    setLoi(null);
    const p = new URLSearchParams({ pageSize: "20" });
    if (loc.q) p.set("q", loc.q);
    if (loc.chuDe) p.set("topic", loc.chuDe);
    if (loc.nguon) p.set("source", loc.nguon);
    try {
      const r = await fetch(`/api/news?${p}`);
      const kq = (await r.json()) as NewsResponse | { error?: string };
      if (!r.ok) throw new Error("error" in kq ? kq.error : "Không đọc được tin tức.");
      setData(kq as NewsResponse);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không đọc được tin tức.");
    } finally {
      setDangTai(false);
    }
  }, [loc]);

  useEffect(() => {
    void fetch("/api/news/sources")
      .then(async (r) => {
        const kq = (await r.json()) as { sources?: NewsSource[] };
        setNguon(kq.sources ?? []);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => void doc(), [doc]);

  async function doiChieu(id: string) {
    setDangChay(id);
    setDoiChieuKq(null);
    setLoi(null);
    try {
      const r = await fetch(`/api/news/${encodeURIComponent(id)}/legal-check`, { method: "POST" });
      const kq = (await r.json()) as LegalCheckResult | { error?: string };
      if (!r.ok) throw new Error("error" in kq ? kq.error : "Không đối chiếu được bài tin.");
      setDoiChieuKq({ id, kq: kq as LegalCheckResult });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không đối chiếu được bài tin.");
    } finally {
      setDangChay(null);
    }
  }

  async function timLienQuan(id: string) {
    setDangChay(id);
    try {
      const r = await fetch(`/api/news/${encodeURIComponent(id)}/related`);
      const kq = (await r.json()) as RelatedArticle[] | { error?: string };
      if (!r.ok) throw new Error("error" in kq ? kq.error : "Không tìm được tin liên quan.");
      setLienQuan({ id, items: kq as RelatedArticle[] });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tìm được tin liên quan.");
    } finally {
      setDangChay(null);
    }
  }

  return (
    <KhungTrang
      tieuDe="Tin tức và pháp luật"
      moTa="Tin lấy từ RSS, chỉ lưu tiêu đề, tóm tắt và liên kết về bài gốc. Mỗi bài đối chiếu được với corpus văn bản để xem tin nói đúng tới đâu."
    >
      <div className="flex flex-col gap-4">
        {/* ---------- Thanh lọc ---------- */}
        <The className="flex flex-col gap-3">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setLoc({ q: q.trim(), chuDe, nguon: slugNguon });
            }}
          >
            <ONhap
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm trong tiêu đề và tóm tắt"
              aria-label="Từ khóa"
            />
            <OChon
              value={slugNguon}
              onChange={(e) => setSlugNguon(e.target.value)}
              aria-label="Nguồn tin"
              className="sm:w-52"
            >
              <option value="">Mọi nguồn</option>
              {nguon.map((n) => (
                <option key={n.slug} value={n.slug}>
                  {n.name}
                </option>
              ))}
            </OChon>
            <Nut type="submit" className="sm:w-auto">
              Lọc tin
            </Nut>
          </form>

          <VienLoc
            cacMuc={NEWS_TOPICS.map((t) => ({ giaTri: t, nhan: NHAN_CHU_DE_TIN[t] }))}
            dangChon={chuDe}
            nhanTatCa="Mọi chủ đề"
            onChon={(t) => {
              setChuDe(t);
              setLoc({ q: q.trim(), chuDe: t, nguon: slugNguon });
            }}
          />
        </The>

        {loi ? <BaoLoi moTa={loi} onThuLai={() => void doc()} /> : null}

        {dangTai ? <XuongDanhSach so={4} /> : null}

        {!dangTai && data.items.length === 0 && !loi ? (
          <TrongRong
            tieuDe="Không có bài tin nào khớp"
            moTa="Thử bỏ bớt bộ lọc, hoặc chọn Mọi chủ đề để xem toàn bộ dòng tin."
            hanhDong={
              <Nut
                kieu="phu"
                onClick={() => {
                  setQ("");
                  setChuDe("");
                  setSlugNguon("");
                  setLoc({ q: "", chuDe: "", nguon: "" });
                }}
              >
                Bỏ bộ lọc
              </Nut>
            }
          />
        ) : null}

        {!dangTai && data.items.length > 0 ? (
          <p className="text-xs text-nhan">Tìm thấy {data.total} bài tin.</p>
        ) : null}

        {/* ---------- Dòng tin ---------- */}
        <div className="flex flex-col gap-3">
          {data.items.map((bai) => (
            <The key={bai.id} className="transition-shadow duration-[--nhip] hover:shadow-noi">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-xs">
                <span className="font-semibold text-muc-in">{bai.source.name}</span>
                {bai.publishedAt ? (
                  <time className="text-nhan" dateTime={bai.publishedAt}>
                    {new Date(bai.publishedAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                ) : null}
              </div>

              <h2 className="mt-2 text-base font-semibold leading-snug">
                <a
                  href={bai.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 transition-colors duration-[--nhip] hover:text-but-xanh hover:underline"
                >
                  {bai.title}
                </a>
              </h2>

              {bai.summary ? (
                <p className="mt-2 text-sm leading-relaxed text-nhan">{bai.summary}</p>
              ) : null}

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                {bai.topics.map((t) => (
                  <Nhan key={t}>{NHAN_CHU_DE_TIN[t]}</Nhan>
                ))}
                <div className="ml-auto flex flex-wrap items-center gap-1.5">
                  <Nut
                    kieu="vien"
                    co="nho"
                    disabled={dangChay === bai.id}
                    onClick={() => void timLienQuan(bai.id)}
                  >
                    So sánh nhiều nguồn
                  </Nut>
                  <Nut
                    kieu="phu"
                    co="nho"
                    disabled={dangChay === bai.id}
                    onClick={() => void doiChieu(bai.id)}
                  >
                    {dangChay === bai.id ? "Đang đối chiếu…" : "Đối chiếu pháp luật"}
                  </Nut>
                </div>
              </div>

              {lienQuan?.id === bai.id ? (
                <section className="mt-4 border-t border-ke-mo pt-4">
                  <TieuDeMuc phu="Cùng chủ đề hoặc trùng từ khóa với bài trên">
                    Bài từ nguồn khác
                  </TieuDeMuc>
                  {lienQuan.items.length > 0 ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {lienQuan.items.map((m) => (
                        <a
                          key={m.id}
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-[--bo] bg-khay p-3 transition-colors duration-[--nhip] hover:bg-khay-sau"
                        >
                          <span className="block text-xs font-medium text-nhan">
                            {m.source.name}
                          </span>
                          <span className="mt-1 block text-sm font-medium leading-snug">
                            {m.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-nhan">
                      Chưa có bài từ nguồn khác đủ gần để so sánh.
                    </p>
                  )}
                </section>
              ) : null}

              {doiChieuKq?.id === bai.id ? (
                <section className="mt-4 border-t border-ke-mo pt-4">
                  <TieuDeMuc>{NHAN_KET_QUA_PHAP_LY[doiChieuKq.kq.status]}</TieuDeMuc>
                  {doiChieuKq.kq.answer ? (
                    <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed">
                      {doiChieuKq.kq.answer}
                    </p>
                  ) : null}
                  {doiChieuKq.kq.citations.length > 0 ? (
                    <div className="mt-3 grid gap-1.5 md:grid-cols-2">
                      {doiChieuKq.kq.citations.map((c, i) => (
                        <ChipTrichDan
                          key={c.chunkId}
                          trichDan={c}
                          soThuTu={i + 1}
                          onChon={() =>
                            router.push(`/documents/${c.documentId}?node=${c.nodeId}`)
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-3.5 text-xs leading-relaxed text-nhan">
                    {doiChieuKq.kq.disclaimer}
                  </p>
                </section>
              ) : null}
            </The>
          ))}
        </div>
      </div>
    </KhungTrang>
  );
}
