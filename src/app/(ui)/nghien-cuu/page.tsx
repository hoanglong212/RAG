"use client";

/**
 * Nghiên cứu sâu — tra cứu vượt ra ngoài kho văn bản.
 *
 * Tách khỏi tra cứu corpus vì hai việc này khác nhau về bản chất: hỏi trong
 * kho là tìm căn cứ đã được kiểm chứng, còn nghiên cứu sâu là đi gom thêm
 * nguồn bên ngoài rồi mới đối chiếu. Trộn chung một ô hỏi kèm công tắc thì
 * người dùng không biết câu trả lời vừa rồi dựa trên cái gì.
 */

import { Sparkles } from "lucide-react";
import { BanTraCuu } from "@/components/tra-cuu/ban-tra-cuu";
import { ConDau } from "@/components/kit/con-dau";
import { cn } from "@/lib/utils";

const CAU_HOI_GOI_Y = [
  "So sánh quy định xử phạt vi phạm giao thông của Việt Nam với thông lệ khu vực",
  "Những thay đổi lớn nào về luật lao động Việt Nam trong ba năm gần đây?",
  "Doanh nghiệp nhỏ cần chuẩn bị gì khi quy định an toàn thực phẩm siết lại?",
];

export default function TrangNghienCuu() {
  return (
    <BanTraCuu
      cheDo="research"
      moTaTruc="Nguồn nào nằm trong kho văn bản sẽ mở được trục và mặt đọc; nguồn bên ngoài mở ra trang gốc."
      khiTrong={(chonCauHoi) => (
        <div className="hien-len py-2">
          <ConDau co={52} className="mb-5 block" />

          <h2 className="chu-trung-bay co-trung-bay max-w-2xl">
            Đi xa hơn
            <br />
            kho văn bản.
          </h2>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-nhan">
            Nghiên cứu sâu gom thêm nguồn bên ngoài rồi đối chiếu ngược lại với các Điều,
            Khoản trong kho. Mỗi nguồn đều hiện rõ nó đến từ đâu — trong kho hay ngoài kho —
            để bạn biết câu trả lời đang dựa trên cái gì.
          </p>

          <p className="nhan-hoa mt-8 flex items-center gap-2">
            <Sparkles className="size-3.5" strokeWidth={1.8} />
            Câu hỏi hợp với nghiên cứu sâu
          </p>
          <ul className="mt-2.5 flex flex-col gap-2">
            {CAU_HOI_GOI_Y.map((cau) => (
              <li key={cau}>
                <button
                  type="button"
                  onClick={() => chonCauHoi(cau)}
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-[--bo-lon] bg-giay py-4 pl-4 pr-3.5",
                    "text-left text-base leading-snug shadow-the ring-1 ring-muc-in/[0.045]",
                    "transition-[box-shadow,transform] duration-[--nhip]",
                    "hover:-translate-y-px hover:shadow-vua",
                  )}
                >
                  <span className="flex-1">{cau}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-lg leading-none text-nhan transition-[transform,color] duration-[--nhip] group-hover:translate-x-0.5 group-hover:text-but-xanh"
                  >
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    />
  );
}
