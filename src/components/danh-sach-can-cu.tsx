"use client";

/**
 * Danh sách căn cứ, GẤP GỌN theo văn bản.
 *
 * Bản cũ đổ tám thẻ, mỗi thẻ kèm 500 ký tự luật thô — thành một bức tường
 * chữ mà không ai đọc, và tệ hơn là nó che mất thông tin thật sự hữu ích:
 * tám điều khoản đó đến từ MẤY văn bản, và điều nào đáng mở trước.
 *
 * Ở đây gom theo số hiệu: một dòng cho mỗi văn bản, bên dưới là các Điều,
 * Khoản thu về đúng một dòng mỗi cái. Muốn đọc nguyên văn thì bung ra. Người
 * dùng quét được toàn cảnh trong hai giây rồi mới quyết định mở cái nào.
 */

import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import type { Citation } from "@/types/contract";
import { ConDau } from "@/components/kit/con-dau";
import { cn } from "@/lib/utils";

/** "Nghị định 168/2024/NĐ-CP > Chương II > Điều 14 > Khoản 2" → "Điều 14 · Khoản 2" */
function viTri(breadcrumb: string): string {
  const phan = breadcrumb
    .split(">")
    .map((s) => s.trim())
    .filter((s) => /^(Điều|Khoản|Điểm|Phụ lục)/.test(s));
  return phan.length > 0 ? phan.join(" · ") : breadcrumb;
}

function Hang({
  trichDan,
  soThuTu,
  onMo,
}: {
  trichDan: Citation;
  soThuTu: number;
  onMo?: (c: Citation) => void;
}) {
  const [bung, setBung] = useState(false);

  return (
    <li className="border-t border-ke-mo first:border-t-0">
      <button
        type="button"
        aria-expanded={bung}
        onClick={() => setBung((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 px-3.5 py-2.5 text-left",
          "transition-colors duration-[--nhip] hover:bg-khay/70",
        )}
      >
        <ConDau co={18} soThuTu={soThuTu} />
        <span className="min-w-0 flex-1 text-sm font-medium">{viTri(trichDan.breadcrumb)}</span>
        <span className="so-hieu shrink-0 text-xs tabular-nums text-nhan">
          {trichDan.score.toFixed(2).replace(".", ",")}
        </span>
        <ChevronRight
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-nhan transition-transform duration-[--nhip]",
            bung && "rotate-90",
          )}
          strokeWidth={1.9}
        />
      </button>

      {bung ? (
        <div className="px-3.5 pb-3.5 pl-[3.25rem]">
          <p className="text-[0.8125rem] leading-relaxed text-nhan">{trichDan.trichDoan}</p>
          {onMo ? (
            <button
              type="button"
              onClick={() => onMo(trichDan)}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-but-xanh underline-offset-4 hover:underline"
            >
              Mở trong văn bản gốc
              <ExternalLink className="size-3.5" strokeWidth={1.9} />
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function DanhSachCanCu({
  citations,
  onMo,
}: {
  citations: Citation[];
  onMo?: (c: Citation) => void;
}) {
  // Giữ nguyên thứ hạng truy hồi bên trong mỗi văn bản, và xếp văn bản có
  // điều khoản mạnh nhất lên trước.
  const theoVanBan = new Map<string, { citation: Citation; so: number }[]>();
  citations.forEach((c, i) => {
    const khoa = c.soHieu || "Không rõ số hiệu";
    const hien = theoVanBan.get(khoa) ?? [];
    hien.push({ citation: c, so: i + 1 });
    theoVanBan.set(khoa, hien);
  });

  const nhom = [...theoVanBan.entries()].sort(
    (a, b) => (b[1][0]?.citation.score ?? 0) - (a[1][0]?.citation.score ?? 0),
  );

  return (
    <div className="flex flex-col gap-2.5">
      {nhom.map(([soHieu, cacMuc]) => (
        <div key={soHieu} className="overflow-hidden rounded-[--bo] bg-giay shadow-the">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 bg-khay px-3.5 py-2.5">
            <span className="so-hieu text-muc-in">{soHieu}</span>
            <span className="text-xs text-nhan">
              {cacMuc.length} điều khoản được truy hồi
            </span>
          </div>
          <ul>
            {cacMuc.map(({ citation, so }) => (
              <Hang key={citation.chunkId} trichDan={citation} soThuTu={so} onMo={onMo} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
