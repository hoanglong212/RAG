"use client";

/**
 * KHAY CÔNG CỤ — ba dụng cụ pháp lý nằm ngay trên thanh điều hướng.
 *
 * Trước đây chúng là một trang riêng. Nhưng đây là thứ người ta cần TRONG LÚC
 * đang đọc một văn bản khác, nên bắt rời màn hình rồi quay lại là đúng cái
 * phiền mà một khay dụng cụ sinh ra để tránh.
 *
 * MỞ BẰNG BA ĐƯỜNG, không chỉ hover:
 *   - rê chuột: mở ngay, đóng sau 200ms khi rời cả nút lẫn panel
 *   - focus bàn phím: mở, Escape đóng và trả focus về nút
 *   - bấm: ghim mở, bấm lại thì đóng — đây là đường duy nhất dùng được trên
 *     màn hình cảm ứng, nơi không hề có khái niệm hover
 *
 * Chỉ làm hover thì công cụ biến mất hoàn toàn trên điện thoại và với người
 * dùng bàn phím.
 */

import { useEffect, useRef, useState } from "react";
import { BO_CONG_CU, type MaCongCu } from "@/components/cong-cu/bo-cong-cu";
import { cn } from "@/lib/utils";

const TRE_DONG = 200;

export function KhayCongCu() {
  const [maMo, setMaMo] = useState<MaCongCu | null>(null);
  const [ghim, setGhim] = useState(false);
  const dongHo = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bocRef = useRef<HTMLDivElement>(null);

  const huyDong = () => {
    if (dongHo.current) clearTimeout(dongHo.current);
  };
  const henDong = () => {
    huyDong();
    if (ghim) return;
    dongHo.current = setTimeout(() => setMaMo(null), TRE_DONG);
  };

  useEffect(() => () => huyDong(), []);

  useEffect(() => {
    if (!maMo) return;
    const thoat = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMaMo(null);
      setGhim(false);
      bocRef.current?.querySelector<HTMLElement>("button")?.focus();
    };
    document.addEventListener("keydown", thoat);
    return () => document.removeEventListener("keydown", thoat);
  }, [maMo]);

  // Bấm ra ngoài thì bỏ ghim.
  useEffect(() => {
    if (!ghim) return;
    const ngoai = (e: MouseEvent) => {
      if (!bocRef.current?.contains(e.target as Node)) {
        setGhim(false);
        setMaMo(null);
      }
    };
    document.addEventListener("mousedown", ngoai);
    return () => document.removeEventListener("mousedown", ngoai);
  }, [ghim]);

  const viTri = BO_CONG_CU.findIndex((c) => c.ma === maMo);
  const congCu = viTri >= 0 ? BO_CONG_CU[viTri] : undefined;

  return (
    <div ref={bocRef} className="relative flex items-center" onMouseLeave={henDong}>
      <span aria-hidden className="mx-1.5 h-5 w-px shrink-0 bg-giay/20" />

      <div className="flex items-center gap-0.5" role="group" aria-label="Công cụ pháp lý">
        {BO_CONG_CU.map((c) => {
          const mo = maMo === c.ma;
          return (
            <button
              key={c.ma}
              type="button"
              aria-expanded={mo}
              aria-label={`${c.nhan} — ${c.moTa}`}
              onMouseEnter={() => {
                huyDong();
                setMaMo(c.ma);
              }}
              onFocus={() => {
                huyDong();
                setMaMo(c.ma);
              }}
              onClick={() => {
                if (mo && ghim) {
                  setGhim(false);
                  setMaMo(null);
                } else {
                  setMaMo(c.ma);
                  setGhim(true);
                }
              }}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-[--bo]",
                "transition-[background-color,color] duration-[--nhip]",
                mo ? "bg-giay text-but-xanh shadow-vua" : "text-giay/60 hover:bg-giay/10 hover:text-giay",
              )}
            >
              <c.icon className="size-4.5" strokeWidth={1.8} />
            </button>
          );
        })}
      </div>

      {congCu ? (
        <div
          onMouseEnter={huyDong}
          className={cn(
            "hien-len absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(38rem,calc(100vw-1.5rem))]",
            "rounded-[--bo-lon] bg-giay shadow-noi ring-1 ring-muc-in/[0.06]",
          )}
        >
          {/*
            Mũi nhọn chỉ đúng nút đang mở.

            Trước đây nó ghim cứng `right-6`, nên dù mở công cụ nào mũi nhọn
            cũng chỉ vào icon cuối cùng — panel trông như gắn nhầm chỗ.

            Số học: nút size-9 (2,25rem) cách nhau gap-0.5 (0,125rem) nên bước
            là 2,375rem; tâm nút thứ i tính từ mép phải là bước×(n−1−i) cộng
            nửa nút 1,125rem. Trừ tiếp 0,375rem vì `right` định vị ô vuông
            CHƯA xoay, mà tâm thị giác của mũi nhọn nằm giữa ô 0,75rem ấy.
          */}
          <span
            aria-hidden
            style={{
              right: `${(BO_CONG_CU.length - 1 - viTri) * 2.375 + 0.75}rem`,
            }}
            className="absolute -top-1.5 size-3 rotate-45 rounded-[2px] bg-giay"
          />

          {/* Đầu panel nói đang mở công cụ nào. Ba icon không nhãn thì sau khi
              bấm người dùng không còn gì xác nhận mình mở đúng cái mình định. */}
          <div className="flex items-baseline gap-2 border-b border-ke-mo px-4 py-2.5 sm:px-5">
            <congCu.icon className="size-4 shrink-0 translate-y-0.5 text-but-xanh" strokeWidth={1.8} />
            <span className="text-sm font-semibold">{congCu.nhan}</span>
            <span className="truncate text-xs text-nhan">{congCu.moTa}</span>
          </div>

          <div className="relative p-4 sm:p-5">
            <congCu.Noi />
          </div>
        </div>
      ) : null}
    </div>
  );
}
