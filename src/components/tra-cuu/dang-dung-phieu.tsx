"use client";

/**
 * ĐANG DỰNG PHIẾU — khoảnh khắc giữa "nguồn đã về" và "chữ đầu tiên".
 *
 * /api/chat gửi `citations` TRƯỚC rồi mới tới `token`, nên có một quãng thật
 * sự tồn tại trong đó hệ thống đã biết căn cứ nhưng chưa có câu trả lời. Trước
 * đây quãng đó được dùng để đẩy cả danh sách Nguồn lên đầu trang — và nó nằm
 * lại đó vĩnh viễn, chắn trước câu trả lời ở mọi lần đọc sau.
 *
 * Ô này giữ đúng khoảnh khắc ấy mà không phải trả cái giá đó: các con dấu đóng
 * xuống lần lượt NGAY TẠI vị trí của phiếu trả lời, rồi phiếu thật thế chỗ.
 * Người dùng thấy hệ thống tìm ra căn cứ trước khi nó kịp nói gì — đó vốn là
 * điều đáng khoe — nhưng thấy ở chỗ mắt họ đang nhìn, chứ không phải bằng cách
 * dựng một bức tường trích đoạn luật.
 */

import type { Citation } from "@/types/contract";
import { ConDau } from "@/components/kit/con-dau";
import { chiDieuKhoan } from "./neo-trich-dan";
import { cn } from "@/lib/utils";

const TRE = ["tre-1", "tre-2", "tre-3", "tre-4", "tre-5", "tre-6"];

export function DangDungPhieu({ citations }: { citations: Citation[] }) {
  const hien = citations.slice(0, 6);

  return (
    <article className="rounded-[--bo-lon] bg-giay px-5 py-5 shadow-vua sm:px-8 sm:py-7">
      <header className="mb-4 flex items-center gap-2 border-b border-ke-mo pb-3">
        <ConDau co={18} />
        <h2 className="nhan-hoa">Trả lời</h2>
        <span className="nhan-hoa ml-auto text-but-xanh">
          Đã tìm được {citations.length} căn cứ
        </span>
      </header>

      <ul className="flex flex-col gap-2">
        {hien.map((td, i) => (
          <li
            key={td.chunkId}
            className={cn("hien-len flex items-center gap-2.5", TRE[i] ?? "tre-6")}
          >
            <ConDau co={20} soThuTu={i + 1} dangDong />
            <span className="so-hieu shrink-0 text-nhan">{td.soHieu}</span>
            <span className="truncate text-[0.8125rem] text-muc-mo">
              {chiDieuKhoan(td.breadcrumb)}
            </span>
          </li>
        ))}
      </ul>

      <p className="nhan-hoa mt-4 text-but-xanh">Đang soạn câu trả lời</p>
      <div aria-hidden className="mt-2 flex flex-col gap-2">
        <span className="luot-sang block h-3 w-full rounded-[--bo] bg-khay" />
        <span className="luot-sang block h-3 w-[82%] rounded-[--bo] bg-khay" />
      </div>
    </article>
  );
}
