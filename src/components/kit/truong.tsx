/**
 * Trường nhập liệu.
 *
 * Tất cả dùng chung một hình thức: nền giấy lõm trong khay, viền mảnh bằng
 * shadow inset thay vì border (border làm lệch chiều cao 1px giữa các loại
 * trường, đây là nguồn xô lệch hàng phổ biến nhất trong form).
 * Vòng focus lấy từ :focus-visible ở globals.css, không khai lại.
 */

import type { ComponentProps, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

const NEN_TRUONG =
  "w-full min-h-11 rounded-[--bo] bg-giay px-3.5 py-2.5 text-sm text-muc-in " +
  "shadow-[inset_0_0_0_1px_var(--ke-mo),0_1px_2px_rgb(16_20_27_/_0.03)] placeholder:text-nhan " +
  "transition-[box-shadow,background-color] duration-[--nhip] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_var(--but-xanh),0_8px_20px_-14px_var(--muc-in)] " +
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

/**
 * Ô văn bản TỰ GIÃN theo nội dung.
 *
 * Ô cố định số dòng bắt người viết cuộn ngầm bên trong một khung nhỏ: gõ tới
 * dòng thứ tám là không còn nhìn thấy đoạn mở đầu, mà mô tả một tình huống
 * tranh chấp thì luôn dài hơn thế. Ở đây ô cao lên theo chữ cho tới một trần,
 * nên toàn bộ nội dung nằm trong tầm mắt.
 */
export function OVanBanTuGian({
  value,
  className,
  caoToiDa = 520,
  ...props
}: ComponentProps<"textarea"> & { caoToiDa?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const chinhChieuCao = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, caoToiDa)}px`;
    el.style.overflowY = el.scrollHeight > caoToiDa ? "auto" : "hidden";
  }, [caoToiDa]);

  /*
   * Đo trong khung hình KẾ TIẾP, không đo ngay.
   *
   * Đo lúc hydrate thì ô chưa có bề ngang thật, chữ giữ chỗ bị xuống dòng
   * thành hàng chục dòng, `scrollHeight` vọt lên và ô trống mở ra chạm trần
   * 520px. Đợi một khung hình là bố cục đã xong, đo mới đúng.
   */
  useEffect(() => {
    const id = requestAnimationFrame(chinhChieuCao);
    return () => cancelAnimationFrame(id);
  }, [value, chinhChieuCao]);

  // Đổi bề ngang cửa sổ thì số dòng đổi theo, phải đo lại.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const theoDoi = new ResizeObserver(() => chinhChieuCao());
    theoDoi.observe(el);
    return () => theoDoi.disconnect();
  }, [chinhChieuCao]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      onInput={chinhChieuCao}
      className={cn(NEN_TRUONG, "resize-none leading-relaxed", className)}
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
              "min-h-9 rounded-full px-3.5 py-2 text-xs font-semibold",
              "transition-[background-color,color,transform,box-shadow] duration-[--nhip] active:translate-y-px",
              chon
                ? "bg-but-xanh text-giay shadow-vua"
                : "bg-giay text-nhan shadow-[inset_0_0_0_1px_var(--ke-mo)] hover:-translate-y-px hover:text-muc-in hover:shadow-the",
            )}
          >
            {m.nhan}
          </button>
        );
      })}
    </div>
  );
}
