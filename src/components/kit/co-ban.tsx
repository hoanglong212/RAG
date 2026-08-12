/**
 * Bộ phần tử nền dùng chung cho mọi trang.
 *
 * Lý do tồn tại: trước đây mỗi trang tự viết `rounded-[--bo-lon] bg-giay p-4`
 * và tự chế nút riêng, nên tám trang ra tám thứ khác nhau. Mọi khác biệt nhìn
 * thấy được từ nay phải là khác biệt CÓ CHỦ Ý, khai ở đây.
 *
 * Nguyên tắc giữ nguyên từ ngày đầu: --dau-do chỉ dành cho neo trích dẫn.
 * Không nút nào, không cảnh báo nào, không biểu đồ nào được dùng nó.
 */

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Nút                                                                 */

type KieuNut = "chinh" | "phu" | "vien" | "lang";
type CoNut = "vua" | "nho";

const KIEU_NUT: Record<KieuNut, string> = {
  chinh: "bg-but-xanh text-giay hover:bg-but-xanh-sau",
  phu: "bg-khay-sau text-muc-in hover:bg-khay-sau/70",
  vien: "bg-transparent text-muc-in shadow-[inset_0_0_0_1px_var(--ke-mo)] hover:bg-khay-sau/60",
  lang: "bg-transparent text-nhan hover:bg-khay-sau hover:text-muc-in",
};

const CO_NUT: Record<CoNut, string> = {
  vua: "px-4 py-2 text-sm",
  nho: "px-2.5 py-1.5 text-xs",
};

export interface NutProps extends ComponentProps<"button"> {
  kieu?: KieuNut;
  co?: CoNut;
}

export function Nut({ kieu = "chinh", co = "vua", className, ...props }: NutProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[--bo] font-medium",
        "transition-[background-color,color,transform] duration-[--nhip]",
        "active:translate-y-px",
        "disabled:pointer-events-none disabled:opacity-45",
        KIEU_NUT[kieu],
        CO_NUT[co],
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Nhãn nhỏ                                                            */

export function Nhan({
  children,
  dam = false,
  className,
}: {
  children: ReactNode;
  dam?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[--bo] px-2 py-0.5 text-xs leading-relaxed",
        dam ? "bg-khay-sau text-muc-in" : "bg-khay text-nhan",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Thẻ giấy                                                            */

export function The({
  children,
  className,
  khongDem = false,
}: {
  children: ReactNode;
  className?: string;
  /** Bỏ padding khi bên trong là bảng hoặc danh sách tự lo lề. */
  khongDem?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[--bo-lon] bg-giay shadow-the",
        khongDem ? "overflow-hidden" : "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tiêu đề mục bên trong trang                                         */

export function TieuDeMuc({
  children,
  phu,
  hanhDong,
  className,
}: {
  children: ReactNode;
  phu?: ReactNode;
  hanhDong?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1", className)}>
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold leading-snug">{children}</h2>
        {phu ? <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-nhan">{phu}</p> : null}
      </div>
      {hanhDong ? <div className="flex shrink-0 items-center gap-2">{hanhDong}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Khung một trang                                                     */

export function KhungTrang({
  tieuDe,
  moTa,
  hanhDong,
  rong = "vua",
  children,
}: {
  tieuDe: string;
  moTa?: ReactNode;
  hanhDong?: ReactNode;
  /** hep: đọc dài · vua: bảng và lưới · rong: dashboard nhiều cột */
  rong?: "hep" | "vua" | "rong";
  children: ReactNode;
}) {
  const beRong =
    rong === "hep" ? "max-w-3xl" : rong === "rong" ? "max-w-6xl" : "max-w-5xl";

  return (
    <div className="h-full overflow-y-auto">
      <div className={cn("mx-auto px-4 pb-16 pt-7 sm:px-6", beRong)}>
        {/*
          Đầu trang mượn cách bày của công văn giấy: khối tiêu đề, rồi một dải
          kẻ dày mỏng song song đóng lại phần tiêu ngữ. Cỡ chữ ở đây cố tình
          lớn hẳn so với phần thân — không có tương phản cỡ chữ thì cả trang
          đều 13px và mắt không có chỗ bám.
        */}
        <header className="ke-quoc-hieu flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-4">
          <div className="min-w-0">
            <h1 className="chu-trung-bay text-[1.75rem] sm:text-[2rem]">{tieuDe}</h1>
            {moTa ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-nhan">{moTa}</p>
            ) : null}
          </div>
          {hanhDong ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{hanhDong}</div>
          ) : null}
        </header>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ô số liệu                                                           */

export function OSoLieu({
  nhan,
  giaTri,
  phu,
}: {
  nhan: string;
  giaTri: string;
  phu?: string;
}) {
  return (
    <The className="flex flex-col justify-between gap-4">
      <p className="nhan-hoa">{nhan}</p>
      <div>
        {/* Con số là thứ người ta tới đây để đọc, nên nó được cỡ chữ lớn nhất trang. */}
        <p className="chu-trung-bay font-ma text-[2.25rem] tabular-nums text-muc-in">
          {giaTri}
        </p>
        {phu ? <p className="mt-2 text-xs leading-relaxed text-nhan">{phu}</p> : null}
      </div>
    </The>
  );
}
