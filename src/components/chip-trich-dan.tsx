"use client";

/**
 * Chip trích dẫn — cái neo giữa câu trả lời và văn bản gốc.
 *
 * Chấm đỏ ở đây là dấu chứng thực, không phải trang trí: nó chỉ xuất hiện khi
 * câu này thật sự neo được vào một Khoản cụ thể. Xem kỷ luật màu ở tokens.css.
 */

import type { Citation } from "@/types/contract";
import { cn } from "@/lib/utils";

/** "Chương II > Điều 8 > Khoản 3" → "Điều 8 · Khoản 3". */
export function rutGonDuongDan(breadcrumb: string): string {
  const phan = breadcrumb
    .split(">")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("Chương") && !s.startsWith("Mục"));
  return phan.length > 0 ? phan.join(" · ") : breadcrumb;
}

export interface ChipTrichDanProps {
  trichDan: Citation;
  /** Số thứ tự khớp với dấu [1], [2] trong câu trả lời. */
  soThuTu: number;
  dangChon?: boolean;
  onChon?: (trichDan: Citation) => void;
}

export function ChipTrichDan({
  trichDan,
  soThuTu,
  dangChon = false,
  onChon,
}: ChipTrichDanProps) {
  return (
    <button
      type="button"
      onClick={() => onChon?.(trichDan)}
      title={`${trichDan.soHieu} — ${trichDan.breadcrumb}`}
      aria-current={dangChon ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-[--bo] px-2.5 py-2 text-left",
        "transition-colors duration-[--nhip]",
        dangChon ? "bg-khay-sau" : "bg-khay/60 hover:bg-khay-sau",
      )}
    >
      <span
        aria-hidden
        className="mt-[7px] size-1.5 shrink-0 rounded-full bg-dau-do"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-[0.8125rem] font-semibold text-dau-do">
            [{soThuTu}]
          </span>
          <span className="so-hieu truncate text-nhan">{trichDan.soHieu}</span>
        </span>
        <span className="mt-0.5 block text-[0.8125rem] font-medium text-muc-in">
          {rutGonDuongDan(trichDan.breadcrumb)}
        </span>
        <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-nhan">
          {trichDan.trichDoan}
        </span>
      </span>
    </button>
  );
}
