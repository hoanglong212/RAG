/**
 * Trường nhập liệu.
 *
 * Tất cả dùng chung một hình thức: nền giấy lõm trong khay, viền mảnh bằng
 * shadow inset thay vì border (border làm lệch chiều cao 1px giữa các loại
 * trường, đây là nguồn xô lệch hàng phổ biến nhất trong form).
 * Vòng focus lấy từ :focus-visible ở globals.css, không khai lại.
 */

import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

const NEN_TRUONG =
  "w-full rounded-[--bo] bg-giay px-3 py-2 text-sm text-muc-in " +
  "shadow-[inset_0_0_0_1px_var(--ke-mo)] placeholder:text-nhan " +
  "transition-shadow duration-[--nhip] " +
  "disabled:cursor-not-allowed disabled:bg-khay disabled:text-nhan";

/** Bọc nhãn + trường + chú thích, giữ khoảng cách nhất quán. */
export function Truong({
  nhan,
  chuThich,
  children,
  className,
}: {
  nhan?: string;
  chuThich?: ReactNode;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {nhan ? (
        <label htmlFor={id} className="nhan-hoa">
          {nhan}
        </label>
      ) : null}
      {children(id)}
      {chuThich ? (
        <p className="text-xs leading-relaxed text-nhan">{chuThich}</p>
      ) : null}
    </div>
  );
}

export function ONhap({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(NEN_TRUONG, className)} />;
}

export function OVanBan({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(NEN_TRUONG, "resize-y leading-relaxed", className)}
    />
  );
}

export function OChon({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        className={cn(NEN_TRUONG, "cursor-pointer appearance-none pr-9", className)}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-nhan"
      >
        <path
          d="M2.5 4.5 6 8l3.5-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Bộ lọc dạng viên thuốc. Dùng cho tập lựa chọn ngắn và hay đổi (chủ đề tin),
 * nơi thẻ select giấu mất phương án và tốn thêm một cú bấm.
 */
export function VienLoc<T extends string>({
  cacMuc,
  dangChon,
  onChon,
  nhanTatCa = "Tất cả",
}: {
  cacMuc: { giaTri: T; nhan: string }[];
  dangChon: T | "";
  onChon: (giaTri: T | "") => void;
  nhanTatCa?: string;
}) {
  const muc: { giaTri: T | ""; nhan: string }[] = [
    { giaTri: "", nhan: nhanTatCa },
    ...cacMuc,
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {muc.map((m) => {
        const chon = m.giaTri === dangChon;
        return (
          <button
            key={m.giaTri || "tat-ca"}
            type="button"
            aria-pressed={chon}
            onClick={() => onChon(m.giaTri)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              "transition-colors duration-[--nhip]",
              chon
                ? "bg-but-xanh text-giay"
                : "bg-giay text-nhan shadow-[inset_0_0_0_1px_var(--ke-mo)] hover:text-muc-in",
            )}
          >
            {m.nhan}
          </button>
        );
      })}
    </div>
  );
}
