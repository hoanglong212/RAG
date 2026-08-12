"use client";

/**
 * TRANG CHỦ — trang riêng, không phải màn tra cứu nữa.
 *
 * Việc của nó: nói sản phẩm này là gì, chứng minh bằng số đo thật của kho,
 * rồi chỉ đường vào đúng việc người dùng đang cần.
 *
 * MỌI CON SỐ Ở ĐÂY ĐỀU ĐỌC TỪ API. Không có số liệu trang trí — một trang
 * chủ khoe "10.000+ văn bản" trong khi kho có 61 thì hỏng ngay ở câu đầu.
 * Kho lớn lên thì trang này tự lớn theo.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Library, Scale, Sparkles } from "lucide-react";
import type { EvalRun, StatsResponse } from "@/types/contract";
import type { NewsArticleSummary } from "@/types/news";
import type { CoverageRow } from "@/types/platform";
import { ConDau } from "@/components/kit/con-dau";
import { The, TieuDeMuc } from "@/components/kit/co-ban";
import { CotNgang } from "@/components/kit/bieu-do";
import { Vach } from "@/components/kit/trang-thai-kit";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";
import { cn } from "@/lib/utils";

const soNhom = (n: number) => n.toLocaleString("vi-VN");
const phanTram = (v: number) => `${Math.round(v * 100)}%`;

/** Ba đường vào chính, mỗi cái là một VIỆC chứ không phải một cái thẻ. */
const LOI_VAO = [
  {
    href: "/documents",
    nhan: "Hỏi trong kho văn bản",
    moTa: "Câu trả lời neo về đúng Điều, Khoản, mở được văn bản gốc ngay cạnh.",
    icon: Library,
  },
  {
    href: "/nghien-cuu",
    nhan: "Nghiên cứu sâu",
    moTa: "Gom thêm nguồn ngoài kho rồi đối chiếu ngược lại với căn cứ trong kho.",
    icon: Sparkles,
  },
  {
    href: "/legal-check",
    nhan: "Kiểm tra tình huống",
    moTa: "Mô tả sự việc bằng lời thường, hệ thống chỉ ra quy định liên quan.",
    icon: Scale,
  },
] as const;

export default function TrangChu() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [tin, setTin] = useState<NewsArticleSummary[]>([]);
  const [phuSong, setPhuSong] = useState<CoverageRow[]>([]);
  const [lanChay, setLanChay] = useState<EvalRun[]>([]);

  useEffect(() => {
    const doc = async <T,>(url: string): Promise<T | null> => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return (await r.json()) as T;
      } catch {
        return null;
      }
    };
    void doc<StatsResponse>("/api/stats").then(setStats);
    void doc<{ items: NewsArticleSummary[] }>("/api/news?pageSize=4").then((d) =>
      setTin(d?.items ?? []),
    );
    void doc<CoverageRow[]>("/api/coverage").then((d) => setPhuSong(d ?? []));
    void doc<EvalRun[]>("/api/eval/runs").then((d) => setLanChay(d ?? []));
  }, []);

  const moiNhat = lanChay.at(-1) ?? null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-5 sm:px-6 sm:pt-7">
        {/* ---------- Mở màn ---------- */}
        <section className="mo-man rounded-[--bo-lon] px-5 py-8 text-giay shadow-noi sm:px-8 sm:py-10">
          <div className="relative z-10">
            <ConDau co={52} className="mb-6 block" />

            <h1 className="chu-trung-bay co-trung-bay max-w-3xl">
              Câu hỏi vào.
              <br />
              Điều, Khoản ra.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-giay/70">
              Công cụ tra cứu văn bản quy phạm pháp luật Việt Nam. Hỏi bằng tiếng Việt
              thường, nhận câu trả lời có đóng dấu về đúng Điều, Khoản trong văn bản gốc.
              Không đủ căn cứ thì hệ thống nói thẳng là không tìm thấy, chứ không đoán.
            </p>

            {stats ? (
              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-giay/15 pt-5">
                <div>
                  <dt className="nhan-hoa-sang">Văn bản trong kho</dt>
                  <dd className="chu-trung-bay co-so-lieu mt-2 font-ma tabular-nums">
                    {soNhom(stats.tongVanBan)}
                  </dd>
                </div>
                <div>
                  <dt className="nhan-hoa-sang">Đoạn đã bóc tách</dt>
                  <dd className="chu-trung-bay co-so-lieu mt-2 font-ma tabular-nums">
                    {soNhom(stats.tongChunk)}
                  </dd>
                </div>
                <div>
                  <dt className="nhan-hoa-sang">Cơ quan ban hành</dt>
                  <dd className="chu-trung-bay co-so-lieu mt-2 font-ma tabular-nums">
                    {soNhom(stats.theoCoQuan.length)}
                  </dd>
                </div>
                <div>
                  <dt className="nhan-hoa-sang">Độ sâu trích dẫn</dt>
                  <dd className="chu-trung-bay co-so-lieu mt-2">Tới Khoản</dd>
                </div>
              </dl>
            ) : (
              <div className="mt-8 flex gap-10 border-t border-giay/15 pt-5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block h-10 w-24 animate-pulse rounded-[--bo] bg-giay/15" />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ---------- Ba lối vào ---------- */}
        <section className="mt-4 grid gap-2 md:grid-cols-3">
          {LOI_VAO.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={cn(
                "group flex flex-col gap-2 rounded-[--bo-lon] bg-giay p-4 shadow-the ring-1 ring-muc-in/[0.045]",
                "transition-[box-shadow,transform] duration-[--nhip] hover:-translate-y-px hover:shadow-vua",
              )}
            >
              <m.icon className="size-5 text-but-xanh" strokeWidth={1.8} />
              <span className="flex items-center gap-1.5 text-base font-semibold">
                {m.nhan}
                <ArrowRight
                  aria-hidden
                  className="size-4 text-nhan transition-transform duration-[--nhip] group-hover:translate-x-0.5"
                  strokeWidth={1.9}
                />
              </span>
              <span className="text-[0.8125rem] leading-relaxed text-nhan">{m.moTa}</span>
            </Link>
          ))}
        </section>

        {/* ---------- Tin mới + độ phủ ---------- */}
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <The className="flex flex-col gap-4">
            <TieuDeMuc
              phu="Tin từ báo trong nước, đối chiếu được với căn cứ trong kho"
              hanhDong={
                <Link
                  href="/news"
                  className="text-[0.8125rem] font-medium text-but-xanh underline-offset-4 hover:underline"
                >
                  Xem tất cả
                </Link>
              }
            >
              Đang diễn ra
            </TieuDeMuc>

            {tin.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {tin.slice(0, 4).map((bai) => (
                  <li key={bai.id}>
                    <a
                      href={bai.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex gap-3"
                    >
                      {bai.imageUrl ? (
                        <span className="shrink-0 overflow-hidden rounded-[--bo] bg-khay">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={bai.imageUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-16 object-cover"
                            onError={(e) => {
                              const boc = e.currentTarget.parentElement;
                              if (boc) boc.style.display = "none";
                            }}
                          />
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-nhan">
                          {bai.source.name}
                        </span>
                        <span className="mt-0.5 block line-clamp-2 text-sm font-medium leading-snug underline-offset-4 group-hover:text-but-xanh group-hover:underline">
                          {bai.title}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Vach className="size-16 shrink-0" />
                    <div className="flex-1">
                      <Vach className="w-20" />
                      <Vach className="mt-2 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </The>

          <The className="flex flex-col gap-4">
            <TieuDeMuc phu="Số văn bản đang phục vụ tra cứu ở từng lĩnh vực">
              Kho đang phủ tới đâu
            </TieuDeMuc>
            {phuSong.length > 0 ? (
              <CotNgang
                toiDaHien={6}
                cacMuc={[...phuSong]
                  .sort((a, b) => b.documents - a.documents)
                  .map((h) => ({
                    nhan: NHAN_CHU_DE_TIN[h.topic],
                    giaTri: h.documents,
                  }))}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Vach key={i} />
                ))}
              </div>
            )}
          </The>
        </div>

        {/* ---------- Chất lượng đo được ---------- */}
        {moiNhat ? (
          <The className="mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div className="min-w-0 max-w-xl">
              <TieuDeMuc phu="Đo trên bộ câu hỏi vàng tự soạn, không phải cảm nhận. Mỗi lần chạy đổi đúng một biến để quy được nguyên nhân.">
                Hệ thống trả lời đúng tới đâu
              </TieuDeMuc>
            </div>
            <div className="flex items-end gap-8">
              <div>
                <p className="nhan-hoa">Recall@5</p>
                <p className="chu-trung-bay co-so-lieu mt-1.5 font-ma tabular-nums text-muc-in">
                  {phanTram(moiNhat.recallAt5)}
                </p>
              </div>
              <div>
                <p className="nhan-hoa">Câu hỏi vàng</p>
                <p className="chu-trung-bay co-so-lieu mt-1.5 font-ma tabular-nums text-muc-in">
                  {moiNhat.nQuestions}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="pb-1.5 text-[0.8125rem] font-medium text-but-xanh underline-offset-4 hover:underline"
              >
                Xem toàn bộ số đo
              </Link>
            </div>
          </The>
        ) : null}
      </div>
    </div>
  );
}
