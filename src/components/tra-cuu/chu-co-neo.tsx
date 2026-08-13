"use client";

/**
 * CHỮ CÓ NEO — một đoạn câu trả lời, với dẫn chiếu pháp lý bấm được tại chỗ.
 *
 * Thay cho CauTraLoi cũ, vốn chỉ nhận dấu [n] — dạng mà mô hình thực tế gần
 * như không bao giờ viết ra ở chế độ tra cứu kho. Xem neo-trich-dan.ts.
 *
 * Ba mức thị giác, và cả ba đều mang nghĩa:
 *
 *   đỏ + số nhỏ   dẫn chiếu giải được về một Khoản đã truy hồi → bấm mở bản gốc
 *   xám + gạch    dẫn chiếu tới văn bản ngoài kho → nhận ra nhưng không đối chiếu được
 *   mono          số hiệu văn bản, là mã định danh chứ không phải văn xuôi
 *
 * Mức thứ hai là chỗ dễ bị bỏ qua nhất và lại quan trọng nhất: nó nói thẳng
 * "câu này viện dẫn một điều luật mà hệ thống không có bản gốc". Tô đỏ hết cho
 * đều mắt sẽ xoá mất đúng cái thông tin đó.
 */

import { Fragment, type ReactNode } from "react";
import { timNeo, type NguonDeNeo } from "./neo-trich-dan";
import { cn } from "@/lib/utils";

/**
 * Ngày tháng và số tiền — phần "trả lời" thật sự nằm trong câu kết luận.
 * Chỉ bật ở kết luận; rải khắp nơi thì thành nhấn mà không nhấn gì.
 */
const SO_LIEU_CHINH =
  /ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d[\d.,]*\s*(?:triệu|tỷ|nghìn)?\s*đồng\b/gi;

interface Manh {
  batDau: number;
  ketThuc: number;
  ve: ReactNode;
}

export function ChuCoNeo({
  chu,
  nguon,
  soDangChon,
  onChonSo,
  nhanManhSoLieu = false,
  className,
}: {
  chu: string;
  nguon: NguonDeNeo[];
  /** Số thứ tự 1-based của nguồn đang mở ở mặt đọc. */
  soDangChon?: number;
  onChonSo?: (so: number) => void;
  nhanManhSoLieu?: boolean;
  className?: string;
}) {
  const manh: Manh[] = [];

  for (const neo of timNeo(chu, nguon)) {
    const dangMo = neo.so > 0 && neo.so === soDangChon;

    if (neo.so === 0) {
      manh.push({
        batDau: neo.batDau,
        ketThuc: neo.ketThuc,
        ve:
          neo.loai === "soHieu" ? (
            <span className="so-hieu">{neo.chu}</span>
          ) : (
            <span
              title="Dẫn chiếu tới văn bản ngoài kho — không có bản gốc để đối chiếu"
              className="cursor-help underline decoration-dotted decoration-nhan/60 underline-offset-[3px]"
            >
              {neo.chu}
            </span>
          ),
      });
      continue;
    }

    manh.push({
      batDau: neo.batDau,
      ketThuc: neo.ketThuc,
      ve: (
        <button
          type="button"
          onClick={() => onChonSo?.(neo.so)}
          title={`Mở nguồn ${neo.so} · ${nguon[neo.so - 1]?.breadcrumb ?? ""}`}
          aria-current={dangMo ? "true" : undefined}
          className={cn(
            "rounded-[--bo] text-left font-medium text-dau-do",
            "underline decoration-dau-do/35 underline-offset-[3px]",
            "transition-colors duration-[--nhip] hover:bg-neo-vang hover:decoration-dau-do",
            neo.loai === "soHieu" && "so-hieu font-semibold",
            dangMo && "bg-neo-vang decoration-dau-do",
          )}
        >
          {neo.chu}
          <sup className="ml-px font-ma text-[0.625em] font-semibold tabular-nums">{neo.so}</sup>
        </button>
      ),
    });
  }

  if (nhanManhSoLieu) {
    for (const khop of chu.matchAll(SO_LIEU_CHINH)) {
      const batDau = khop.index;
      const ketThuc = batDau + khop[0].length;
      const dungCho = manh.some((m) => batDau < m.ketThuc && ketThuc > m.batDau);
      if (dungCho) continue;
      manh.push({
        batDau,
        ketThuc,
        ve: <strong className="font-semibold text-muc-in">{khop[0]}</strong>,
      });
    }
    manh.sort((a, b) => a.batDau - b.batDau);
  }

  const ra: ReactNode[] = [];
  let viTri = 0;
  let khoa = 0;
  for (const m of manh) {
    if (m.batDau > viTri) ra.push(<Fragment key={khoa++}>{chu.slice(viTri, m.batDau)}</Fragment>);
    ra.push(<Fragment key={khoa++}>{m.ve}</Fragment>);
    viTri = m.ketThuc;
  }
  if (viTri < chu.length) ra.push(<Fragment key={khoa++}>{chu.slice(viTri)}</Fragment>);

  return <span className={className}>{ra}</span>;
}
