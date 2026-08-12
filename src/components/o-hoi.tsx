"use client";

/**
 * Ô đặt câu hỏi.
 *
 * Nút nói đúng việc sẽ xảy ra: "Tra cứu", không phải "Gửi". Tên hành động này
 * giữ nguyên suốt luồng, kể cả ở nút thử lại sau khi lỗi.
 */

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface OHoiProps {
  giaTri: string;
  onDoi: (giaTri: string) => void;
  onTraCuu: () => void;
  dangChay?: boolean;
}

export function OHoi({ giaTri, onDoi, onTraCuu, dangChay = false }: OHoiProps) {
  const id = useId();
  const rong = giaTri.trim().length === 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!rong && !dangChay) onTraCuu();
      }}
      className="flex flex-col gap-2.5"
    >
      <label htmlFor={id} className="nhan-hoa">
        Câu hỏi
      </label>
      <textarea
        id={id}
        value={giaTri}
        onChange={(e) => onDoi(e.target.value)}
        onKeyDown={(e) => {
          // Enter tra cứu, Shift+Enter xuống dòng.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!rong && !dangChay) onTraCuu();
          }
        }}
        rows={2}
        placeholder="Ví dụ: Điều kiện cấp giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm?"
        className={cn(
          "w-full resize-none rounded-[--bo] bg-giay px-3.5 py-3 text-sm",
          // Chữ giữ chỗ vẫn phải đọc được: dùng đủ --nhan, không giảm độ mờ.
          "placeholder:text-nhan",
          "shadow-[inset_0_0_0_1px_var(--ke-mo)]",
        )}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={rong || dangChay}
          className={cn(
            "rounded-[--bo] px-4 py-2 text-sm font-medium",
            "transition-colors duration-[--nhip]",
            "bg-but-xanh text-giay hover:bg-but-xanh-sau",
            "disabled:cursor-not-allowed disabled:bg-nhan/40",
          )}
        >
          {dangChay ? "Đang tra cứu…" : "Tra cứu"}
        </button>
      </div>
    </form>
  );
}
