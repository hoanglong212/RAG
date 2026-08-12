"use client";

/**
 * Ô đặt câu hỏi — hành động chính của cả sản phẩm.
 *
 * Nút nói đúng việc sẽ xảy ra: "Tra cứu", không phải "Gửi". Tên hành động này
 * giữ nguyên suốt luồng, kể cả ở nút thử lại sau khi lỗi.
 *
 * Ô nhập nằm trên nền giấy, nổi khỏi khay: nó là chỗ duy nhất trên màn hình
 * người dùng gõ vào, nên nó phải là thứ mắt bám vào trước.
 */

import { useId } from "react";
import { Nut } from "@/components/kit/co-ban";
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
      className={cn(
        "flex flex-col gap-3 rounded-[--bo-lon] bg-giay p-3 shadow-the",
        "transition-shadow duration-[--nhip] focus-within:shadow-noi",
      )}
    >
      <label htmlFor={id} className="sr-only">
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
        placeholder="Hỏi bằng tiếng Việt thường: điều kiện cấp giấy chứng nhận an toàn thực phẩm là gì?"
        className={cn(
          "w-full resize-none bg-transparent px-1.5 pt-1 text-[0.9375rem] leading-relaxed",
          "placeholder:text-nhan focus-visible:outline-none",
        )}
      />
      <div className="flex items-center justify-between gap-3 pl-1.5">
        <p className="text-xs text-nhan">
          <kbd className="font-ma">Enter</kbd> để tra cứu ·{" "}
          <kbd className="font-ma">Shift + Enter</kbd> xuống dòng
        </p>
        <Nut type="submit" disabled={rong || dangChay}>
          {dangChay ? "Đang tra cứu…" : "Tra cứu"}
        </Nut>
      </div>
    </form>
  );
}
