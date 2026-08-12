/**
 * Ba trạng thái mọi trang phải có: đang tải, rỗng, hỏng.
 *
 * KỶ LUẬT MÀU: không cái nào ở đây được dùng --dau-do. Đỏ là dấu chứng thực
 * của trích dẫn; tô đỏ một thông báo lỗi làm hỏng nghĩa đó ở mọi nơi khác
 * trong sản phẩm. Lỗi được phân biệt bằng SỨC NẶNG — một thanh mực dày bên
 * trái và tiêu đề in đậm — chứ không bằng màu.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { The } from "./co-ban";

/* ------------------------------------------------------------------ */

/** Vệt xám thay cho dòng chữ "Đang tải…". */
export function Vach({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block h-3 animate-pulse rounded-[--bo] bg-khay-sau", className)}
    />
  );
}

/** Khung xương cho danh sách thẻ. Giữ đúng nhịp của nội dung thật. */
export function XuongDanhSach({ so = 3 }: { so?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Đang tải">
      {Array.from({ length: so }, (_, i) => (
        <The key={i}>
          <Vach className="w-24" />
          <Vach className="mt-3 h-4 w-3/4" />
          <Vach className="mt-2.5 w-full" />
          <Vach className="mt-2 w-2/3" />
        </The>
      ))}
    </div>
  );
}

/** Khung xương cho lưới ô số liệu. */
export function XuongSoLieu({ so = 4 }: { so?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      role="status"
      aria-label="Đang tải"
    >
      {Array.from({ length: so }, (_, i) => (
        <The key={i}>
          <Vach className="w-20" />
          <Vach className="mt-4 h-6 w-16" />
        </The>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Trạng thái rỗng là lời mời hành động, không phải thông báo buồn.
 * Luôn nói được: chưa có gì, và làm gì thì sẽ có.
 */
export function TrongRong({
  tieuDe,
  moTa,
  hanhDong,
}: {
  tieuDe: string;
  moTa: ReactNode;
  hanhDong?: ReactNode;
}) {
  return (
    <The className="flex flex-col items-start gap-3 py-10 sm:items-center sm:text-center">
      <div className="sm:max-w-md">
        <p className="font-semibold">{tieuDe}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-nhan">{moTa}</p>
      </div>
      {hanhDong}
    </The>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Lỗi không xin lỗi và không mơ hồ về chuyện đã xảy ra.
 * Nói rõ cái gì hỏng, và dữ liệu của người dùng có sao không.
 */
export function BaoLoi({
  tieuDe = "Không đọc được dữ liệu",
  moTa,
  onThuLai,
}: {
  tieuDe?: string;
  moTa: ReactNode;
  onThuLai?: () => void;
}) {
  return (
    <div
      role="alert"
      /* Không dùng dải màu dọc bên trái: ở sản phẩm này mọi vạch màu đứng cạnh
         nội dung đều dễ bị đọc nhầm thành neo trích dẫn. Lỗi phân biệt bằng
         SỨC NẶNG — nền khay đậm hơn giấy và tiêu đề in đậm. */
      className="rounded-[--bo-lon] bg-khay-sau px-4 py-4 shadow-the"
    >
      <p className="text-sm font-semibold">{tieuDe}</p>
      <p className="mt-1 text-sm leading-relaxed text-nhan">{moTa}</p>
      {onThuLai ? (
        <button
          type="button"
          onClick={onThuLai}
          className="mt-3 text-sm font-medium text-but-xanh underline-offset-4 hover:underline"
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

/** Thông báo ngắn sau một hành động đã chạy xong. */
export function BaoTin({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-[--bo] bg-giay px-3.5 py-2.5 text-sm text-muc-in shadow-the"
    >
      {children}
    </p>
  );
}
