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
import { docLoi, docPhanHoi, layJson } from "@/components/kit/goi-api";
import type { LegalCheckResult } from "@/lib/legal/check";
import { NEWS_TOPICS, type NewsArticleSummary, type NewsTopic } from "@/types/news";
import { NHAN_CHU_DE_TIN, NHAN_KET_QUA_PHAP_LY } from "@/types/nhan-news";

/**
 * "3 giờ trước" đọc nhanh hơn "12/08/2026 09:22" khi cái người đọc muốn biết
 * là tin này còn mới hay đã cũ. Quá một tuần thì ngày tháng lại rõ hơn.
 */
function khoangCachThoiGian(iso: string): string {
  const giay = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (giay < 60) return "Vừa xong";
  if (giay < 3600) return `${Math.floor(giay / 60)} phút trước`;
  if (giay < 86400) return `${Math.floor(giay / 3600)} giờ trước`;
  if (giay < 604800) return `${Math.floor(giay / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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
      setData(await layJson<NewsResponse>(`/api/news?${p}`));
    } catch (e) {
      setLoi(docLoi(e));
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
      const duongDan = `/api/news/${encodeURIComponent(id)}/legal-check`;
      const r = await fetch(duongDan, { method: "POST" });
      setDoiChieuKq({ id, kq: await docPhanHoi<LegalCheckResult>(r, duongDan) });
    } catch (e) {
      setLoi(docLoi(e));
    } finally {
      setDangChay(null);
    }
  }

  async function timLienQuan(id: string) {
    setDangChay(id);
    try {
      const items = await layJson<RelatedArticle[]>(
        `/api/news/${encodeURIComponent(id)}/related`,
      );
      setLienQuan({ id, items });
    } catch (e) {
      setLoi(docLoi(e));
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
            <The key={bai.id} className="transition-shadow duration-[--nhip] hover:shadow-vua">
              <div className="flex flex-col gap-4 sm:flex-row">
                {/*
                  Ảnh bài báo dùng thẻ img thường, không phải next/image: nguồn
                  RSS đổi theo thời gian nên không whitelist trước được domain,
                  mà cho phép mọi host trong next.config thì mất luôn ý nghĩa
                  của việc whitelist. Ảnh hỏng thì tự ẩn, không để lại khung vỡ.
                */}
                {bai.imageUrl ? (
                  <a
                    href={bai.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 overflow-hidden rounded-[--bo] bg-khay sm:w-44"
                    tabIndex={-1}
                    aria-hidden
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bai.imageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-[--nhip-cham] hover:scale-[1.03]"
                      onError={(e) => {
                        const boc = e.currentTarget.closest("a");
                        if (boc) boc.style.display = "none";
                      }}
                    />
                  </a>
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-xs">
                    <span className="font-semibold text-muc-in">{bai.source.name}</span>
                    {bai.publishedAt ? (
                      <time className="text-nhan" dateTime={bai.publishedAt}>
                        {khoangCachThoiGian(bai.publishedAt)}
                      </time>
                    ) : null}
                  </div>

                  <h2 className="mt-1.5 text-base font-semibold leading-snug">
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
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-nhan">
                      {bai.summary}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                {bai.topics.map((t) => (
                  <Nhan key={t} dam>
                    {NHAN_CHU_DE_TIN[t]}
                  </Nhan>
                ))}
                {/* Từ khoá do bộ nạp tin rút ra; hiện tối đa ba cái để hàng
                    nhãn không dài hơn cả tiêu đề. */}
                {bai.keywords.slice(0, 3).map((k) => (
                  <Nhan key={k}>{k}</Nhan>
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
