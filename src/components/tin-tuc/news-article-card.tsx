"use client";

/**
 * THẺ BÀI TIN.
 *
 * Bản cũ dựng hai mươi thẻ giống hệt nhau, mỗi thẻ mang một thanh hành động có
 * kẻ trên, hai nút và toàn bộ nhãn chủ đề. Lặp hai mươi lần thì thanh đó nặng
 * hơn chính tin tức, và vì mọi thẻ cùng một cân nặng nên trang không nói được
 * bài nào đáng đọc trước — đó là danh sách, không phải trang tin.
 *
 * Giờ có hai dạng. Bài dẫn được ảnh lớn và tiêu đề cỡ câu chốt; phần còn lại
 * gọn lại để lướt. Hành động hạ xuống dạng chữ, trừ "Đối chiếu pháp luật" —
 * đó là thứ duy nhất phân biệt sản phẩm này với một trình đọc RSS, nên nó giữ
 * màu mực bút.
 */

import { Nhan, The, TieuDeMuc } from "@/components/kit/co-ban";
import type { NewsArticleSummary } from "@/types/news";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";
import type { LegalCheckResult } from "@/lib/legal/check";
import { LegalCheckInline } from "./legal-check-inline";
import { khoangCachTu } from "./dong-thoi-gian";
import { cn } from "@/lib/utils";

interface RelatedArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  publishedAt: string | null;
  source: { slug: string; name: string };
}

/**
 * Từ khóa trùng nhãn chủ đề thì bỏ.
 *
 * Trước đây bài về giáo dục hiện "Giáo dục" (nhãn chủ đề) rồi "giáo dục" (từ
 * khóa) sát cạnh nhau — cùng một chữ, hai lần, chỉ khác chữ hoa. Người đọc mất
 * một nhịp để nhận ra hai cái đó không mang thêm thông tin gì.
 */
function tuKhoaConLai(keywords: string[], topics: NewsArticleSummary["topics"]): string[] {
  const daCo = new Set(topics.map((t) => NHAN_CHU_DE_TIN[t].toLowerCase()));
  return keywords.filter((k) => !daCo.has(k.trim().toLowerCase())).slice(0, 3);
}

function ThanhHanhDong({
  dangChay,
  coTheDoiChieu,
  onTimLienQuan,
  onDoiChieu,
}: {
  dangChay: boolean;
  coTheDoiChieu: boolean;
  onTimLienQuan: () => void;
  onDoiChieu: () => void;
}) {
  const nen =
    "min-h-9 rounded-[--bo] px-2.5 text-[0.8125rem] font-semibold " +
    "transition-colors duration-[--nhip] disabled:pointer-events-none disabled:opacity-45";
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        disabled={dangChay}
        onClick={onTimLienQuan}
        className={cn(nen, "text-nhan hover:bg-khay hover:text-muc-in")}
      >
        So sánh nguồn
      </button>
      {/*
        Nút đối chiếu chỉ hiện khi kho THẬT SỰ phủ chủ đề của bài.
        Trước đây nó có mặt trên mọi thẻ, kể cả tin bóng đá và tin quốc tế —
        và bấm vào thì nhận về tám điều luật Việt Nam gán bừa. Mời người dùng
        làm một việc mà hệ thống không làm nổi là cách nhanh nhất để họ thôi
        tin những lần nó làm được thật.
      */}
      {coTheDoiChieu ? (
        <button
          type="button"
          disabled={dangChay}
          onClick={onDoiChieu}
          className={cn(nen, "text-but-xanh hover:bg-but-xanh-nhat")}
        >
          {dangChay ? "Đang đối chiếu…" : "Đối chiếu pháp luật"}
        </button>
      ) : null}
    </div>
  );
}

function Anh({
  bai,
  className,
  tiLe,
}: {
  bai: NewsArticleSummary;
  className?: string;
  tiLe: string;
}) {
  if (!bai.imageUrl) return null;
  return (
    <a
      href={bai.url}
      target="_blank"
      rel="noreferrer"
      className={cn("block shrink-0 overflow-hidden rounded-[--bo] bg-khay", className)}
      tabIndex={-1}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bai.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn(
          "w-full object-cover transition-transform duration-[--nhip-cham] hover:scale-[1.03]",
          tiLe,
        )}
        onError={(e) => {
          const boc = e.currentTarget.closest("a");
          if (boc) boc.style.display = "none";
        }}
      />
    </a>
  );
}

function DauBai({ bai }: { bai: NewsArticleSummary }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
      <span className="font-semibold text-muc-mo">{bai.source.name}</span>
      {bai.publishedAt ? (
        <>
          <span aria-hidden className="text-nhan">
            ·
          </span>
          <time className="text-nhan" dateTime={bai.publishedAt}>
            {khoangCachTu(bai.publishedAt)}
          </time>
        </>
      ) : null}
    </div>
  );
}

export function NewsArticleCard({
  bai,
  kieu = "thuong",
  coTheDoiChieu = false,
  dangChay,
  lienQuan,
  doiChieuKq,
  onTimLienQuan,
  onDoiChieu,
}: {
  bai: NewsArticleSummary;
  /** "dan" = bài dẫn đầu dòng tin, được ảnh lớn và tiêu đề cỡ câu chốt. */
  kieu?: "dan" | "thuong";
  /** Kho văn bản có phủ chủ đề của bài này không. Đo từ /api/coverage. */
  coTheDoiChieu?: boolean;
  dangChay: boolean;
  lienQuan: RelatedArticle[] | null;
  doiChieuKq: LegalCheckResult | null;
  onTimLienQuan: () => void;
  onDoiChieu: () => void;
}) {
  const dan = kieu === "dan";
  const tuKhoa = tuKhoaConLai(bai.keywords, bai.topics);

  return (
    <The className="sang-khi-cham transition-shadow duration-[--nhip-cham] hover:shadow-vua">
      <div className={cn(dan ? "flex flex-col gap-4" : "flex flex-col gap-3.5 sm:flex-row")}>
        <Anh
          bai={bai}
          tiLe={dan ? "aspect-[2/1]" : "aspect-[16/10]"}
          className={dan ? undefined : "sm:w-40"}
        />

        <div className="min-w-0 flex-1">
          <DauBai bai={bai} />

          <h3 className={cn("mt-1.5", dan ? "co-ket-luan" : "text-base font-semibold leading-snug")}>
            <a
              href={bai.url}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 transition-colors duration-[--nhip] hover:text-but-xanh hover:underline"
            >
              {bai.title}
            </a>
          </h3>

          {bai.summary ? (
            <p
              className={cn(
                "mt-2 text-sm leading-[--dong-body] text-muc-mo",
                dan ? "line-clamp-3" : "line-clamp-2",
              )}
            >
              {bai.summary}
            </p>
          ) : null}
        </div>
      </div>

      {/* Không kẻ ngang phân cách: hai mươi đường kẻ chồng lên nhau đọc thành
          hàng rào chứ không thành cấu trúc. Khoảng trắng đủ tách rồi. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {bai.topics.slice(0, 2).map((t) => (
            <Nhan key={t} dam>
              {NHAN_CHU_DE_TIN[t]}
            </Nhan>
          ))}
          {tuKhoa.map((k) => (
            <Nhan key={k}>{k}</Nhan>
          ))}
        </div>
        <div className="ml-auto">
          <ThanhHanhDong
            dangChay={dangChay}
            coTheDoiChieu={coTheDoiChieu}
            onTimLienQuan={onTimLienQuan}
            onDoiChieu={onDoiChieu}
          />
        </div>
      </div>

      {lienQuan ? (
        <section className="hien-len mt-4 border-t border-ke-mo pt-4">
          <TieuDeMuc phu="Cùng chủ đề hoặc trùng từ khóa với bài trên">
            Bài từ nguồn khác
          </TieuDeMuc>
          {lienQuan.length > 0 ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {lienQuan.map((m) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[--bo] bg-khay p-3 transition-colors duration-[--nhip] hover:bg-khay-sau"
                >
                  <span className="block text-xs font-medium text-nhan">{m.source.name}</span>
                  <span className="mt-1 block text-sm font-medium leading-snug">{m.title}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muc-mo">
              Chưa có bài từ nguồn khác đủ gần để so sánh.
            </p>
          )}
        </section>
      ) : null}

      {doiChieuKq ? <LegalCheckInline doiChieuKq={doiChieuKq} /> : null}
    </The>
  );
}
