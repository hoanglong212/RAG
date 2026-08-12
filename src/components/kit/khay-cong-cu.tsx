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

  const congCu = BO_CONG_CU.find((c) => c.ma === maMo);

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
            "absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(38rem,calc(100vw-1.5rem))]",
            "rounded-[--bo-lon] bg-giay p-4 shadow-noi ring-1 ring-muc-in/[0.06] sm:p-5",
          )}
        >
          {/* Mũi nhọn chỉ về nút đang mở, để panel không trôi lơ lửng. */}
          <span
            aria-hidden
            className="absolute -top-1.5 right-6 size-3 rotate-45 rounded-[2px] bg-giay"
          />
          <div className="relative">
            <congCu.Noi />
          </div>
        </div>
      ) : null}
    </div>
  );
}
