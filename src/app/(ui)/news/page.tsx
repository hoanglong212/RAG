"use client";

/**
 * Tin tức và pháp luật.
 *
 * Hai khiếu nại được sửa ở đây:
 *
 * 1. "Tin tức không cập nhật theo mỗi ngày." Đúng, và đo được: 152 bài lấy về
 *    lúc 16:25 ngày 12/08 rồi thôi. Có sẵn `npm run news:sync` và route
 *    /api/news/sync nhưng không có gì gọi chúng theo lịch. Trang giờ đo độ
 *    tươi ngay trên dữ liệu nó vừa nhận và nói ra, kèm chỗ bấm cập nhật.
 *
 * 2. Cách bày từng bài chưa đủ hút mắt. Hai mươi thẻ cùng một cân nặng thì
 *    không có bài nào nổi lên; giờ có bài dẫn, và dòng tin gom theo ngày.
 *
 * Gom theo ngày còn làm một việc mà danh sách phẳng không làm được: nó để lộ
 * khoảng trống. Thiếu ngày 13/08 thì không có tiêu đề "Hôm qua" — nhìn là biết.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { KhungTrang, Nut } from "@/components/kit/co-ban";
import { BaoLoi, TrongRong, XuongDanhSach } from "@/components/kit/trang-thai-kit";
import { docLoi, docPhanHoi, layJson } from "@/components/kit/goi-api";
import type { LegalCheckResult } from "@/lib/legal/check";
import type { NewsArticleSummary, NewsTopic } from "@/types/news";

import { NewsFilterBar } from "@/components/tin-tuc/news-filter-bar";
import { NewsArticleCard } from "@/components/tin-tuc/news-article-card";
import { DaiTrangThai, type KetQuaDongBo } from "@/components/tin-tuc/dai-trang-thai";
import { doDoTuoi, gomTheoNgay } from "@/components/tin-tuc/dong-thoi-gian";

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

/** Đầu mục của một khúc dòng tin. Nổi bật dành cho khúc đối chiếu được. */
function DauMuc({
  tieuDe,
  phu,
  so,
  noiBat = false,
}: {
  tieuDe: string;
  phu: string;
  so: number;
  noiBat?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-2.5">
        <h2 className={noiBat ? "text-base font-semibold text-muc-in" : "nhan-hoa text-muc-mo"}>
          {tieuDe}
        </h2>
        <span aria-hidden className="h-px flex-1 bg-ke-mo" />
        <span className="so-hieu text-nhan">{so}</span>
      </div>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-nhan">{phu}</p>
    </div>
  );
}

export default function TrangTinTuc() {
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

  const [phamViKho, setPhamViKho] = useState<Set<NewsTopic>>(new Set());
  const [demNguon, setDemNguon] = useState<Record<string, number>>({});
  const [dangDongBo, setDangDongBo] = useState(false);
  const [ketQuaDongBo, setKetQuaDongBo] = useState<KetQuaDongBo[] | null>(null);
  const [loiDongBo, setLoiDongBo] = useState<string | null>(null);

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

  /*
   * Phạm vi thật của kho văn bản, đọc từ /api/coverage.
   *
   * Đây là thứ quyết định bài nào được mời "Đối chiếu pháp luật". Trước đây
   * nút đó có trên MỌI thẻ; bấm vào một tin bóng đá thì vẫn nhận về tám điều
   * luật Việt Nam kèm điểm 0,48 — cùng mức điểm với một tin vi phạm y tế thật.
   * Lấy phạm vi từ dữ liệu chứ không tự liệt kê chủ đề nào "nghe có vẻ pháp
   * lý": kho hiện phủ an toàn thực phẩm, đất đai, giao thông, lao động, người
   * tiêu dùng — và danh sách đó sẽ đổi khi nạp thêm văn bản.
   */
  useEffect(() => {
    void fetch("/api/coverage")
      .then(async (r) => {
        const rows = (await r.json()) as { topic: string; documents: number }[];
        setPhamViKho(
          new Set(rows.filter((x) => x.documents > 0).map((x) => x.topic as NewsTopic)),
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => void doc(), [doc]);

  /*
   * Đếm trước số báo khác cùng đưa cho cả danh sách, một lượt gọi.
   * Nút "So sánh nguồn" chỉ hiện ở bài có kết quả — xem ghi chú trong
   * ThanhHanhDong về vì sao.
   */
  useEffect(() => {
    if (data.items.length === 0) return;
    let huy = false;
    void fetch("/api/news/related-counts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: data.items.slice(0, 50).map((b) => b.id) }),
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: Record<string, number>) => {
        if (!huy) setDemNguon(d ?? {});
      })
      .catch(() => undefined);
    return () => {
      huy = true;
    };
  }, [data.items]);

  async function dongBo() {
    setDangDongBo(true);
    setLoiDongBo(null);
    setKetQuaDongBo(null);
    try {
      const r = await fetch("/api/news/sync", { method: "POST" });
      if (r.status === 401 || r.status === 503) {
        // Production đòi NEWS_SYNC_TOKEN. Nói thẳng vì sao thay vì báo "lỗi".
        setLoiDongBo(
          "Bản chạy này không cho cập nhật từ trình duyệt. Việc lấy tin cần chạy theo lịch ở phía máy chủ.",
        );
        return;
      }
      const kq = await docPhanHoi<{ results?: KetQuaDongBo[] }>(r, "/api/news/sync");
      setKetQuaDongBo(kq.results ?? []);
      await doc();
    } catch (e) {
      setLoiDongBo(docLoi(e));
    } finally {
      setDangDongBo(false);
    }
  }

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
      const items = await layJson<RelatedArticle[]>(`/api/news/${encodeURIComponent(id)}/related`);
      setLienQuan({ id, items });
    } catch (e) {
      setLoi(docLoi(e));
    } finally {
      setDangChay(null);
    }
  }

  /*
   * Độ tươi đo từ chính dữ liệu vừa nhận, không phải một trường riêng.
   * Hợp đồng /api/news chưa trả `fetchedAt` — xem ghi chú cuối file.
   */
  const doTuoi = useMemo(() => {
    const moiNhat = data.items.reduce<string | null>((max, b) => {
      if (!b.publishedAt) return max;
      return !max || b.publishedAt > max ? b.publishedAt : max;
    }, null);
    return doDoTuoi(moiNhat);
  }, [data.items]);

  /*
   * Chia dòng tin theo thứ hệ thống LÀM ĐƯỢC cho từng bài, không theo thứ tự
   * thời gian thuần.
   *
   * Phóng to bài đầu tiên không phải là một nguyên tắc sắp xếp, nó chỉ là một
   * bài to hơn. Sản phẩm này khác một trình đọc RSS ở đúng một chỗ: nó đối
   * chiếu được tin với kho luật. Vậy thì trục tổ chức đúng của trang phải là
   * "bài nào đối chiếu được", và điều đó đo được từ /api/coverage.
   */
  const { doiChieuDuoc, conLai } = useMemo(() => {
    if (phamViKho.size === 0) return { doiChieuDuoc: [], conLai: data.items };
    const trong: NewsArticleSummary[] = [];
    const ngoai: NewsArticleSummary[] = [];
    for (const b of data.items) {
      (b.topics.some((t) => phamViKho.has(t)) ? trong : ngoai).push(b);
    }
    return { doiChieuDuoc: trong, conLai: ngoai };
  }, [data.items, phamViKho]);

  const nhomNgay = useMemo(() => gomTheoNgay(conLai), [conLai]);
  const coBai = !dangTai && data.items.length > 0;
  const coLoc = Boolean(loc.q || loc.chuDe || loc.nguon);

  function baiThe(
    bai: NewsArticleSummary,
    kieu: "dan" | "thuong" = "thuong",
    coTheDoiChieu = false,
  ) {
    return (
      <NewsArticleCard
        key={bai.id}
        bai={bai}
        kieu={kieu}
        coTheDoiChieu={coTheDoiChieu}
        soNguonKhac={demNguon[bai.id] ?? 0}
        dangChay={dangChay === bai.id}
        lienQuan={lienQuan?.id === bai.id ? lienQuan.items : null}
        doiChieuKq={doiChieuKq?.id === bai.id ? doiChieuKq.kq : null}
        onTimLienQuan={() => void timLienQuan(bai.id)}
        onDoiChieu={() => void doiChieu(bai.id)}
      />
    );
  }

  return (
    <KhungTrang
      tieuDe="Tin tức và pháp luật"
      moTa="Tin lấy từ RSS, chỉ lưu tiêu đề, tóm tắt và liên kết về bài gốc. Mỗi bài đối chiếu được với corpus văn bản để xem tin nói đúng tới đâu."
    >
      <div className="flex flex-col gap-4">
        {coBai ? (
          <DaiTrangThai
            doTuoi={doTuoi}
            soBai={data.total}
            nguon={nguon}
            dangDongBo={dangDongBo}
            ketQua={ketQuaDongBo}
            loi={loiDongBo}
            onDongBo={() => void dongBo()}
          />
        ) : null}

        <NewsFilterBar
          q={q}
          setQ={setQ}
          slugNguon={slugNguon}
          setSlugNguon={setSlugNguon}
          chuDe={chuDe}
          setChuDe={setChuDe}
          nguon={nguon}
          onApplyFilter={setLoc}
        />

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

        {coBai ? (
          <>
            {coLoc ? (
              <p className="text-[0.8125rem] text-nhan">
                {data.total.toLocaleString("vi-VN")} bài khớp bộ lọc.
              </p>
            ) : null}

            <div className="flex flex-col gap-7">
              {doiChieuDuoc.length > 0 ? (
                <section aria-label="Tin đối chiếu được với kho">
                  <DauMuc
                    tieuDe="Đối chiếu được với kho"
                    phu={`Chủ đề của những bài này nằm trong ${phamViKho.size} lĩnh vực kho đang phủ`}
                    so={doiChieuDuoc.length}
                    noiBat
                  />
                  <div className="flex flex-col gap-3">
                    {doiChieuDuoc.map((bai, i) =>
                      baiThe(bai, i === 0 ? "dan" : "thuong", true),
                    )}
                  </div>
                </section>
              ) : null}

              {nhomNgay.length > 0 ? (
                <section aria-label="Tin còn lại">
                  {doiChieuDuoc.length > 0 ? (
                    <DauMuc
                      tieuDe="Tin khác"
                      phu="Kho chưa có văn bản cho những chủ đề này, nên chưa đối chiếu được"
                      so={conLai.length}
                    />
                  ) : null}
                  <div className="flex flex-col gap-5">
                    {nhomNgay.map((nhom, iNhom) => (
                      <div key={nhom.khoa}>
                        <div className="mb-2.5 flex items-baseline gap-2.5">
                          <h3 className="nhan-hoa text-muc-mo">{nhom.nhan}</h3>
                          <span aria-hidden className="h-px flex-1 bg-ke-mo" />
                          <span className="so-hieu text-nhan">{nhom.bai.length}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          {nhom.bai.map((bai, i) =>
                            // Không có bài nào đối chiếu được thì bài mới nhất
                            // vẫn dẫn dòng tin — trang không được để trống đỉnh.
                            baiThe(
                              bai,
                              doiChieuDuoc.length === 0 && iNhom === 0 && i === 0
                                ? "dan"
                                : "thuong",
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </KhungTrang>
  );
}
