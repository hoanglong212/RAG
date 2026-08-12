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
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { Nut } from "@/components/kit/co-ban";
import { cn } from "@/lib/utils";

export interface OHoiProps {
  giaTri: string;
  onDoi: (giaTri: string) => void;
  onTraCuu: () => void;
  dangChay?: boolean;
  /** Do trang quyết định; chỉ đổi chữ trên nhãn và nút, không có công tắc. */
  cheDo?: "corpus" | "research";
}

export function OHoi({
  giaTri,
  onDoi,
  onTraCuu,
  dangChay = false,
  cheDo = "corpus",
}: OHoiProps) {
  const id = useId();
  const rong = giaTri.trim().length === 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!rong && !dangChay) onTraCuu();
      }}
      className={cn(
        "o-hoi-noi-bat flex flex-col gap-3 overflow-hidden rounded-[--bo-lon] bg-giay p-4 shadow-vua ring-1 ring-muc-in/[0.045] sm:p-5",
        "transition-[box-shadow,transform] duration-[--nhip] focus-within:-translate-y-px focus-within:shadow-noi",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-but-xanh">
          <Search className="size-4" strokeWidth={1.8} />
          {cheDo === "research" ? "Nghiên cứu ngoài kho dữ liệu" : "Tra cứu trên toàn bộ kho văn bản"}
        </span>
        <span className="hidden items-center gap-1.5 text-[0.6875rem] font-medium text-nhan sm:flex">
          <Sparkles className="size-3.5" strokeWidth={1.7} />
          Có dẫn nguồn
        </span>
      </div>
      {/*
        Không còn nút gạt chế độ ở đây. Hỏi trong kho văn bản và nghiên cứu sâu
        giờ là hai trang riêng, nên chế độ do NGỮ CẢNH quyết định thay vì bắt
        người dùng nhớ mình đang đứng ở nấc nào của một cái công tắc.
      */}
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
        rows={3}
        placeholder="Hỏi bằng tiếng Việt thường: điều kiện cấp giấy chứng nhận an toàn thực phẩm là gì?"
        className={cn(
          "w-full resize-none bg-transparent px-0 pt-1 text-base font-medium leading-relaxed tracking-[-0.01em]",
          "placeholder:text-nhan focus-visible:outline-none",
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ke-mo pt-3">
        <p className="hidden text-xs text-nhan sm:block">
          <kbd className="font-ma">Enter</kbd> để tra cứu ·{" "}
          <kbd className="font-ma">Shift + Enter</kbd> xuống dòng
        </p>
        <Nut type="submit" disabled={rong || dangChay} className="ml-auto min-w-32">
          {dangChay ? (cheDo === "research" ? "Đang nghiên cứu…" : "Đang tra cứu…") : (cheDo === "research" ? "Nghiên cứu" : "Tra cứu")}
          {!dangChay ? <ArrowRight className="size-4" strokeWidth={1.9} /> : null}
        </Nut>
      </div>
    </form>
  );
}
