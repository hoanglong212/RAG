"use client";

/**
 * KẾT QUẢ ĐỐI CHIẾU PHÁP LUẬT cho một bài tin.
 *
 * Bản cũ hỏng ở hai chỗ, và cộng lại thì tính năng thành vô nghĩa:
 *
 * 1. Nó chỉ dựng `answer`. Mà khi phân tích có cấu trúc chạy được thì
 *    check.ts trả `answer: null` và đặt toàn bộ nội dung vào `phanTich` —
 *    trường chưa từng được đọc ở đây. Nên ngay cả lúc CHẠY ĐÚNG, người dùng
 *    cũng chỉ thấy tám chip điều luật và không một câu phân tích nào.
 *
 * 2. Nó dựng `citations` bất kể `status`. `evidence_only` nghĩa là mô hình đã
 *    trả về KHÔNG_TÌM_THẤY — hệ thống tự nói nó không kết luận được — nhưng
 *    tám điều luật vẫn bày ra y như một kết quả thật.
 *
 * Đo trên máy: bài "Ông Trump kháng cáo phán quyết chặn xây phòng khiêu vũ"
 * nhận status `evidence_only`, topScore 0,481, và tám căn cứ trong đó có Bộ
 * luật Lao động 45/2019/QH14. Ngưỡng 0,35 không bao giờ chặn được vì mô hình
 * embedding trả điểm quanh 0,48 cho gần như mọi thứ.
 *
 * CLAUDE.md gọi đây là câu quan trọng nhất của hệ thống: khi độ tin cậy thấp
 * phải hiện "Không tìm thấy trong bộ tài liệu", và phải thiết kế cho nó một
 * trạng thái đàng hoàng. Đó là việc file này làm lại.
 */

import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { PhanTichTinhHuong } from "@/components/phan-tich-tinh-huong";
import type { LegalCheckResult } from "@/lib/legal/check";

/** Chỉ hai trạng thái này mới là kết luận. Còn lại là "chưa nói được gì". */
function laKetLuan(status: LegalCheckResult["status"]): boolean {
  return status === "matched";
}

export function LegalCheckInline({ doiChieuKq }: { doiChieuKq: LegalCheckResult }) {
  const router = useRouter();
  const ketLuan = laKetLuan(doiChieuKq.status);

  return (
    <section className="hien-len mt-4 border-t border-ke-mo pt-4">
      {ketLuan ? (
        <>
          {/* Phân tích có cấu trúc là thứ đáng đọc nhất, và trước đây bị bỏ
              rơi hoàn toàn dù đã được tính xong. */}
          {doiChieuKq.phanTich ? (
            <PhanTichTinhHuong
              phanTich={doiChieuKq.phanTich}
              citations={doiChieuKq.citations}
              onMoCanCu={(c) => router.push(`/documents/${c.documentId}?node=${c.nodeId}`)}
            />
          ) : doiChieuKq.answer ? (
            <p className="whitespace-pre-wrap text-sm leading-[--dong-body]">
              {doiChieuKq.answer}
            </p>
          ) : null}

          {doiChieuKq.citations.length > 0 ? (
            <div className="mt-3 grid gap-1.5 md:grid-cols-2">
              {doiChieuKq.citations.map((c, i) => (
                <ChipTrichDan
                  key={c.chunkId}
                  trichDan={c}
                  soThuTu={i + 1}
                  onChon={() => router.push(`/documents/${c.documentId}?node=${c.nodeId}`)}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <KhongKetLuan kq={doiChieuKq} />
      )}

      <p className="mt-3.5 text-xs leading-relaxed text-nhan">{doiChieuKq.disclaimer}</p>
    </section>
  );
}

/**
 * Trạng thái "không kết luận được", làm cho tử tế.
 *
 * Đây không phải lỗi và không được trông như lỗi: kho văn bản chỉ có luật Việt
 * Nam, còn tin thì có cả tin quốc tế và thể thao. Trả lời "chỗ này tôi không
 * nói được gì" là câu trả lời ĐÚNG, và nói ra được nó mới là thứ phân biệt một
 * hệ thống có dẫn nguồn với một cái máy đoán.
 *
 * Các đoạn đã truy hồi vẫn giữ lại, nhưng gập vào và gọi đúng tên: chúng là
 * thứ hệ thống đã xét rồi loại, không phải căn cứ.
 */
function KhongKetLuan({ kq }: { kq: LegalCheckResult }) {
  const router = useRouter();
  return (
    <div>
      <p className="text-sm font-semibold">Không tìm thấy trong bộ tài liệu</p>
      <p className="mt-1.5 text-sm leading-[--dong-body] text-muc-mo">
        {kq.status === "insufficient_corpus"
          ? "Kho văn bản chưa phủ chủ đề của bài này, nên không có gì để đối chiếu."
          : "Bài này không khớp đủ gần với quy định nào trong kho. Kho chỉ chứa văn bản pháp luật Việt Nam."}
      </p>

      {kq.citations.length > 0 ? (
        <details className="group mt-2.5">
          <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-[0.8125rem] text-nhan transition-colors duration-[--nhip] hover:text-but-xanh">
            <span
              aria-hidden
              className="inline-block transition-transform duration-[--nhip] group-open:rotate-90"
            >
              ▸
            </span>
            {kq.citations.length} đoạn đã xét rồi loại
          </summary>
          <div className="mt-2 grid gap-1.5 opacity-75 md:grid-cols-2">
            {kq.citations.map((c, i) => (
              <ChipTrichDan
                key={c.chunkId}
                trichDan={c}
                soThuTu={i + 1}
                onChon={() => router.push(`/documents/${c.documentId}?node=${c.nodeId}`)}
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
