"use client";

/**
 * Thanh lọc dòng tin.
 *
 * Hai thứ được sửa ở đây, cả hai đều nhìn thấy trên ảnh chụp:
 *
 * 1. Nút "Lọc tin" bị cắt mất chữ ở mép phải. ONhap là <input> có `w-full`
 *    nhưng nằm trực tiếp trong flex row mà không có min-w-0, nên nó không co
 *    được và đẩy nút tràn ra ngoài thẻ. Bọc thêm một lớp min-w-0 flex-1.
 *
 * 2. Mười sáu viên chủ đề xuống hai hàng, chiếm gần hết phần đầu trang trước
 *    khi thấy một dòng tin nào. Dồn về một hàng cuộn ngang — mọi lựa chọn vẫn
 *    còn, nhưng bộ lọc không được quyền to hơn thứ nó lọc.
 */

import { Nut, The } from "@/components/kit/co-ban";
import { OChon, ONhap } from "@/components/kit/truong";
import { NEWS_TOPICS, type NewsTopic } from "@/types/news";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";
import { cn } from "@/lib/utils";

interface NewsSource {
  slug: string;
  name: string;
}

export function NewsFilterBar({
  q,
  setQ,
  slugNguon,
  setSlugNguon,
  chuDe,
  setChuDe,
  nguon,
  onApplyFilter,
}: {
  q: string;
  setQ: (s: string) => void;
  slugNguon: string;
  setSlugNguon: (s: string) => void;
  chuDe: NewsTopic | "";
  setChuDe: (t: NewsTopic | "") => void;
  nguon: NewsSource[];
  onApplyFilter: (newLoc: { q: string; chuDe: NewsTopic | ""; nguon: string }) => void;
}) {
  const muc: { giaTri: NewsTopic | ""; nhan: string }[] = [
    { giaTri: "", nhan: "Mọi chủ đề" },
    ...NEWS_TOPICS.map((t) => ({ giaTri: t, nhan: NHAN_CHU_DE_TIN[t] })),
  ];

  return (
    <The className="flex flex-col gap-3">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          onApplyFilter({ q: q.trim(), chuDe, nguon: slugNguon });
        }}
      >
        {/* min-w-0 ở đây là thứ giữ cho nút không bị đẩy ra khỏi thẻ. */}
        <div className="min-w-0 flex-1">
          <ONhap
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm trong tiêu đề và tóm tắt"
            aria-label="Từ khóa"
          />
        </div>
        <OChon
          value={slugNguon}
          onChange={(e) => setSlugNguon(e.target.value)}
          aria-label="Nguồn tin"
          className="sm:w-44"
        >
          <option value="">Mọi nguồn</option>
          {nguon.map((n) => (
            <option key={n.slug} value={n.slug}>
              {n.name}
            </option>
          ))}
        </OChon>
        <Nut type="submit" className="shrink-0 sm:w-auto">
          Lọc tin
        </Nut>
      </form>

      <div
        role="group"
        aria-label="Lọc theo chủ đề"
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
      >
        {muc.map((m) => {
          const chon = m.giaTri === chuDe;
          return (
            <button
              key={m.giaTri || "tat-ca"}
              type="button"
              aria-pressed={chon}
              onClick={() => {
                setChuDe(m.giaTri);
                onApplyFilter({ q: q.trim(), chuDe: m.giaTri, nguon: slugNguon });
              }}
              className={cn(
                "min-h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold",
                "transition-[background-color,color,box-shadow] duration-[--nhip]",
                chon
                  ? "bg-but-xanh text-giay shadow-vua"
                  : "bg-giay text-nhan shadow-[inset_0_0_0_1px_var(--ke-mo)] hover:text-muc-in hover:shadow-the",
              )}
            >
              {m.nhan}
            </button>
          );
        })}
      </div>
    </The>
  );
}
