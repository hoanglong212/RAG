"use client";

/**
 * BÁO TÌNH TRẠNG NGUỒN TIN — chỉ lên tiếng khi có chuyện.
 *
 * Bản trước là một dải thường trực có nút "Cập nhật ngay". Nó ra đời để chữa
 * việc trang đứng yên hai ngày mà không nói gì, và nó chữa được — nhưng cái
 * giá là một thanh chiếm chỗ vĩnh viễn chỉ để thông báo mọi thứ vẫn bình
 * thường, cộng một cái nút mà lẽ ra người dùng không phải bấm.
 *
 * Giờ trang tự lấy tin mới khi mở, nên trạng thái khỏe mạnh không cần nói gì
 * cả. Chỉ còn hai tình huống đáng chiếm chỗ:
 *
 *   - đang lấy tin: một dòng mờ, để việc trang tự đổi nội dung không đến bất ngờ;
 *   - có nguồn hỏng hoặc lấy xong mà tin vẫn cũ: nói thẳng nguồn nào và vì sao.
 *
 * Im lặng khi hỏng chính là lỗi ban đầu. Không quay lại đó.
 */

import type { DoTuoi } from "./dong-thoi-gian";

export interface KetQuaDongBo {
  source: string;
  status: string;
  inserted?: number;
  error?: string | null;
}

export function BaoTinhTrangNguon({
  doTuoi,
  nguon,
  dangDongBo,
  ketQua,
  loi,
}: {
  doTuoi: DoTuoi;
  nguon: { slug: string; name: string }[];
  dangDongBo: boolean;
  ketQua: KetQuaDongBo[] | null;
  loi: string | null;
}) {
  if (dangDongBo) {
    return (
      <p className="flex items-center gap-2 px-1 text-[0.8125rem] text-nhan">
        <span aria-hidden className="nhip-tho size-1.5 shrink-0 rounded-full bg-but-xanh" />
        Đang lấy tin mới…
      </p>
    );
  }

  const hong = ketQua?.filter((r) => r.status !== "ok") ?? [];
  const cu = doTuoi.mucDo === "cu";
  if (!loi && hong.length === 0 && !cu) return null;

  /* API đồng bộ trả slug ("thanh-nien"); người đọc biết tờ báo qua tên của nó. */
  const tenNguon = (slug: string) => nguon.find((n) => n.slug === slug)?.name ?? slug;

  return (
    <p className="rounded-[--bo] bg-khay-sau px-3 py-2 text-[0.8125rem] leading-relaxed text-muc-mo">
      {loi ??
        (hong.length > 0 ? (
          <>
            Không lấy được tin từ{" "}
            <strong className="font-semibold">
              {hong.map((r) => tenNguon(r.source)).join(", ")}
            </strong>
            {hong[0]?.error ? ` — ${hong[0].error.replace(/\.\s*$/, "")}.` : "."}{" "}
            {cu ? `Bài mới nhất đã ${doTuoi.moTa}.` : "Các nguồn còn lại vẫn cập nhật."}
          </>
        ) : (
          <>Đã lấy tin nhưng chưa có bài nào mới; bài mới nhất vẫn {doTuoi.moTa}.</>
        ))}
    </p>
  );
}
