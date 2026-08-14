"use client";

/**
 * BỘ CHỌN VĂN BẢN — thay cho thẻ <select> gốc.
 *
 * Vì sao phải thay:
 *
 *  - 41 trong 62 văn bản KHÔNG có trích yếu, mà nhãn cũ ghép cứng
 *    `${soHieu} — ${trichYeu}`, nên hơn hai phần ba danh sách hiện ra thành
 *    "281/2026/NĐ-CP — " với một gạch ngang cụt lủn;
 *  - 62 dòng trong một select gốc không lọc được, phải cuộn để tìm;
 *  - trình duyệt cắt cụt dòng dài, và bề rộng menu do hệ điều hành quyết định
 *    nên nó tràn ra khỏi panel công cụ.
 *
 * Ở đây gõ để lọc — theo số hiệu, theo trích yếu, và không dấu cũng khớp, vì
 * gõ "dat dai" nhanh hơn "đất đai". Loại văn bản suy từ đuôi số hiệu nên mỗi
 * dòng vẫn có nghĩa kể cả khi trích yếu trống.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { loaiVanBan } from "@/components/tra-cuu/neo-trich-dan";
import { boDau } from "@/lib/news/lien-quan";
import type { DocumentSummary } from "@/types/contract";
import { cn } from "@/lib/utils";

export function ChonVanBan({
  value,
  onChange,
  docs,
  nhan,
  gioiHan,
  khiTrong,
}: {
  value: string;
  onChange: (v: string) => void;
  docs: DocumentSummary[];
  nhan: string;
  /** Chỉ cho chọn trong tập id này. Bỏ trống là chọn trong toàn kho. */
  gioiHan?: Set<string>;
  /** Câu hiện khi tập cho phép rỗng. */
  khiTrong?: string;
}) {
  const id = useId();
  const [mo, setMo] = useState(false);
  const [tim, setTim] = useState("");
  const boc = useRef<HTMLDivElement>(null);

  const chonDuoc = useMemo(
    () => (gioiHan ? docs.filter((d) => gioiHan.has(d.id)) : docs),
    [docs, gioiHan],
  );

  const loc = useMemo(() => {
    const k = boDau(tim.trim());
    if (!k) return chonDuoc;
    return chonDuoc.filter((d) =>
      boDau(`${d.soHieu ?? ""} ${d.trichYeu ?? ""}`).includes(k),
    );
  }, [chonDuoc, tim]);

  const dangChon = docs.find((d) => d.id === value);

  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: MouseEvent) => {
      if (!boc.current?.contains(e.target as Node)) setMo(false);
    };
    document.addEventListener("mousedown", ngoai);
    return () => document.removeEventListener("mousedown", ngoai);
  }, [mo]);

  if (chonDuoc.length === 0 && khiTrong) {
    return (
      <p className="rounded-[--bo] bg-khay px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-muc-mo">
        {khiTrong}
      </p>
    );
  }

  return (
    <div ref={boc} className="relative min-w-0">
      <button
        type="button"
        id={id}
        aria-label={nhan}
        aria-expanded={mo}
        onClick={() => {
          setMo((v) => !v);
          setTim("");
        }}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-[--bo] bg-giay px-3.5 py-2.5 text-left",
          "shadow-[inset_0_0_0_1px_var(--ke-mo),0_1px_2px_rgb(16_20_27_/_0.03)]",
          "transition-[box-shadow,background-color] duration-[--nhip] hover:bg-white",
          mo && "shadow-[inset_0_0_0_1px_var(--but-xanh),0_8px_20px_-14px_var(--muc-in)]",
        )}
      >
        {dangChon ? (
          <NhanVanBan d={dangChon} />
        ) : (
          <span className="truncate text-sm text-nhan">Chọn văn bản</span>
        )}
        <svg aria-hidden viewBox="0 0 12 12" className="ml-auto size-3 shrink-0 text-nhan">
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {mo ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 overflow-hidden rounded-[--bo] bg-giay shadow-noi ring-1 ring-muc-in/[0.08]">
          <input
            autoFocus
            value={tim}
            onChange={(e) => setTim(e.target.value)}
            placeholder="Gõ số hiệu hoặc tên văn bản"
            className="w-full border-b border-ke-mo bg-giay px-3.5 py-2.5 text-sm outline-none placeholder:text-nhan"
          />
          <ul className="max-h-64 overflow-y-auto">
            {loc.length === 0 ? (
              <li className="px-3.5 py-3 text-[0.8125rem] text-nhan">Không có văn bản nào khớp.</li>
            ) : (
              loc.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(d.id);
                      setMo(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 px-3.5 py-2 text-left transition-colors duration-[--nhip]",
                      d.id === value ? "bg-but-xanh-nhat" : "hover:bg-khay",
                    )}
                  >
                    <NhanVanBan d={d} nhieuDong />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Một dòng văn bản. Không bao giờ in gạch ngang khi trích yếu trống — thay vào
 * đó là loại văn bản suy từ đuôi số hiệu, vốn luôn có.
 */
function NhanVanBan({ d, nhieuDong = false }: { d: DocumentSummary; nhieuDong?: boolean }) {
  const soHieu = d.soHieu ?? "Không có số hiệu";
  const tom = d.trichYeu?.trim();
  return (
    <span className="min-w-0 flex-1">
      <span className="flex items-baseline gap-2">
        <span className="so-hieu shrink-0 font-semibold text-muc-in">{soHieu}</span>
        <span className="shrink-0 text-xs text-nhan">{loaiVanBan(soHieu)}</span>
      </span>
      {tom ? (
        <span
          className={cn(
            "mt-0.5 block text-[0.8125rem] leading-relaxed text-muc-mo",
            nhieuDong ? "line-clamp-2" : "truncate",
          )}
        >
          {tom}
        </span>
      ) : null}
    </span>
  );
}
