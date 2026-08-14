"use client";

/**
 * QUY ĐỊNH LIÊN QUAN TRONG KHO — không phải phán xét bài báo.
 *
 * Bản trước dựng kết quả của checkLegalScenario như thể đó là kết luận pháp lý
 * về bản tin. Hai lý do khiến việc đó sai từ gốc:
 *
 * 1. checkLegalScenario viết cho TÌNH HUỐNG NGƯỜI DÙNG TỰ KỂ ("chủ nhà không
 *    trả cọc"): nó hỏi cần làm gì tiếp, thiếu dữ kiện nào, giữ chứng cứ gì.
 *    Một bản tin đã tường thuật xong một vụ việc không có chỗ cho những câu
 *    hỏi đó. Hệ quả đo được: phần "Chứng cứ cần giữ" của một vụ thao túng cổ
 *    phiếu hiện ra "Báo cáo hiện trạng sử dụng đất... Ủy ban nhân dân cấp tỉnh
 *    nơi có đất", còn phần kết luận chỉ chép lại đúng cái tiêu đề.
 *
 * 2. Kho chỉ có 69 văn bản xử phạt hành chính trong năm lĩnh vực hẹp, mà điểm
 *    truy hồi trả về ~0,48 cho gần như mọi bài — kể cả tin quốc tế. Không có
 *    ngưỡng nào tách được, nên mọi bản tin đều nhận đủ tám điều luật.
 *
 * Giờ tính năng trả lời một câu hỏi hẹp hơn và trả lời được: KHO CÓ QUY ĐỊNH
 * NÀO VỀ CHUYỆN NÀY. Đó là tra cứu, không phải kết luận — và tra cứu thì hệ
 * thống làm đúng được.
 */

import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import type { LegalCheckResult } from "@/lib/legal/check";
import { loaiVanBan } from "@/components/tra-cuu/neo-trich-dan";
import { chiDieuKhoan } from "@/components/tra-cuu/neo-trich-dan";
import type { Citation } from "@/types/contract";

/**
 * Chỉ giữ những đoạn thật sự gần.
 *
 * Kho trả về tám đoạn cho mọi truy vấn, và đuôi danh sách luôn là văn bản
 * ngành khác lọt vào. Lấy mốc tương đối theo đoạn cao điểm nhất: đoạn nào rơi
 * dưới 92% điểm của đoạn đầu thì không cùng một chuyện.
 */
function locDoanGan(citations: Citation[]): Citation[] {
  if (citations.length === 0) return [];
  const cao = citations[0].score;
  return citations.filter((c) => c.score >= cao * 0.92).slice(0, 4);
}

export function LegalCheckInline({ doiChieuKq }: { doiChieuKq: LegalCheckResult }) {
  const router = useRouter();
  const gan = locDoanGan(doiChieuKq.citations);
  const soVanBan = new Set(gan.map((c) => c.soHieu)).size;

  return (
    <section className="hien-len mt-4 border-t border-ke-mo pt-4">
      <h4 className="nhan-hoa text-muc-mo">Quy định liên quan trong kho</h4>

      {gan.length === 0 ? (
        <p className="mt-2 text-sm leading-[--dong-body] text-muc-mo">
          Không tìm thấy trong bộ tài liệu. Kho hiện chỉ có văn bản xử phạt vi phạm hành chính
          về an toàn thực phẩm, đất đai, giao thông, lao động và bảo vệ người tiêu dùng.
        </p>
      ) : (
        <>
          {/*
            Câu này cố ý nhạt. Nó nói kho CÓ GÌ, không nói bản tin ĐÚNG hay SAI
            — hệ thống không đủ căn cứ để nói điều thứ hai, và giả vờ nói được
            là cách chắc chắn nhất để mất tin cậy ở những chỗ nó nói đúng.
          */}
          <p className="mt-1.5 text-sm leading-[--dong-body] text-muc-mo">
            Kho có {gan.length} điều khoản trong {soVanBan}{" "}
            {soVanBan === 1 ? "văn bản" : "văn bản"} cùng lĩnh vực với bản tin này. Đây là tra
            cứu để bạn tự đối chiếu, không phải kết luận về nội dung bài báo.
          </p>

          <ul className="mt-2.5 flex flex-col gap-1.5">
            {gan.map((c, i) => (
              <li key={c.chunkId}>
                <ChipTrichDan
                  trichDan={{ ...c, breadcrumb: nhanGon(c) }}
                  soThuTu={i + 1}
                  onChon={() => router.push(`/documents/${c.documentId}?node=${c.nodeId}`)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-3 text-xs leading-relaxed text-nhan">{doiChieuKq.disclaimer}</p>
    </section>
  );
}

/** "Nghị định 168/2024/NĐ-CP · Điều 7 · Khoản 7" — loại suy từ đuôi số hiệu. */
function nhanGon(c: Citation): string {
  const dk = chiDieuKhoan(c.breadcrumb);
  return `${loaiVanBan(c.soHieu)} ${c.soHieu} · ${dk}`;
}
