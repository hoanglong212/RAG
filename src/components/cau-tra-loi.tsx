"use client";

/**
 * Câu trả lời của LLM, với các dấu [1] [2] biến thành neo bấm được.
 *
 * Đây là chỗ duy nhất trong câu văn được dùng --dau-do, và nó hợp lệ: dấu [n]
 * chính là neo trích dẫn. Bấm vào là mở đúng Khoản ở mặt đọc, nên người dùng
 * kiểm chứng được từng ý ngay tại chỗ nó được khẳng định — không phải cuộn
 * xuống cuối rồi tự đoán ý nào ứng với nguồn nào.
 */

import { Fragment } from "react";
import { cn } from "@/lib/utils";

const DAU_TRICH_DAN = /\[(\d{1,2})\]/g;

export function CauTraLoi({
  noiDung,
  soTrichDan,
  dangChon,
  onChonSo,
  dangViet = false,
}: {
  noiDung: string;
  soTrichDan: number;
  /** Số thứ tự (1-based) của trích dẫn đang mở. */
  dangChon?: number;
  onChonSo?: (so: number) => void;
  dangViet?: boolean;
}) {
  const manh: React.ReactNode[] = [];
  let viTri = 0;
  let khoa = 0;

  for (const khop of noiDung.matchAll(DAU_TRICH_DAN)) {
    const batDau = khop.index ?? 0;
    const so = Number(khop[1]);
    if (batDau > viTri) {
      manh.push(<Fragment key={`t${khoa++}`}>{noiDung.slice(viTri, batDau)}</Fragment>);
    }
    // Dấu trỏ ra ngoài danh sách nguồn thì để nguyên chữ, không tạo neo hỏng.
    if (so >= 1 && so <= soTrichDan) {
      manh.push(
        <button
          key={`n${khoa++}`}
          type="button"
          onClick={() => onChonSo?.(so)}
          title={`Mở nguồn ${so}`}
          className={cn(
            "mx-px inline-flex min-w-[1.375rem] justify-center rounded-[--bo] px-1",
            "align-baseline text-[0.8125rem] font-semibold text-dau-do",
            "transition-colors duration-[--nhip] hover:bg-neo-vang",
            dangChon === so && "bg-neo-vang",
          )}
        >
          {so}
        </button>,
      );
    } else {
      manh.push(<Fragment key={`x${khoa++}`}>{khop[0]}</Fragment>);
    }
    viTri = batDau + khop[0].length;
  }
  if (viTri < noiDung.length) {
    manh.push(<Fragment key={`t${khoa++}`}>{noiDung.slice(viTri)}</Fragment>);
  }

  return (
    <p className="whitespace-pre-wrap text-[0.9375rem] leading-[--dong-body]">
      {manh}
      {dangViet ? (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse bg-muc-in/60"
        />
      ) : null}
    </p>
  );
}
