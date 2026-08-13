"use client";

/**
 * Chip trích dẫn — cái neo giữa câu trả lời và văn bản gốc.
 *
 * Chấm đỏ ở đây là dấu chứng thực, không phải trang trí: nó chỉ xuất hiện khi
 * câu này thật sự neo được vào một Khoản cụ thể. Xem kỷ luật màu ở tokens.css.
 *
 * Điểm truy hồi hiện ngay trên chip. Người dùng có quyền biết hệ thống tự tin
 * tới đâu với từng nguồn, chứ không chỉ với cả câu trả lời.
 */

import type { Citation } from "@/types/contract";
import { ConDau } from "@/components/kit/con-dau";
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
        "flex w-full items-start gap-3 rounded-[--bo] px-3 py-2.5 text-left",
        "bg-giay shadow-the transition-shadow duration-[--nhip] hover:shadow-noi",
        dangChon && "shadow-noi [box-shadow:inset_0_0_0_1px_var(--dau-do),var(--do-noi)]",
      )}
    >
      {/* Con dấu mang luôn số thứ tự, nên không cần lặp lại "[n]" bằng chữ. */}
      <ConDau co={26} soThuTu={soThuTu} dangDong={dangChon} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="so-hieu truncate text-nhan">{trichDan.soHieu}</span>
          <span className="so-hieu ml-auto shrink-0 text-xs tabular-nums text-nhan">
            {trichDan.score.toFixed(2).replace(".", ",")}
          </span>
        </span>
        <span className="mt-1 block text-[0.8125rem] font-medium text-muc-in">
          {rutGonDuongDan(trichDan.breadcrumb)}
        </span>
        {/* KHÔNG thêm `block` ở đây: line-clamp cần display:-webkit-box, và
            `block` ghi đè nó nên cả trích đoạn 500 ký tự đổ ra nguyên si. */}
        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-nhan">
          {trichDan.trichDoan}
        </span>
      </span>
    </button>
  );
}
