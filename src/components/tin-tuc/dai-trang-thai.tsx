"use client";

/**
 * DẢI TRẠNG THÁI NGUỒN TIN.
 *
 * Trang tin cũ không có chỗ nào nói dòng tin tươi tới đâu. Đo trên máy thật:
 * toàn bộ 152 bài lấy về lúc 16:25 ngày 12/08 rồi dừng; hai ngày sau trang vẫn
 * bày ra y như bình thường, chỉ có dòng "2 ngày trước" cỡ 12px nằm cạnh tên
 * báo. Người dùng phát hiện ra bằng cách tự thấy tin quen quen — đó là cách tệ
 * nhất để biết.
 *
 * Một trang tin im lặng về độ tươi của chính nó là nói dối bằng cách bỏ sót.
 * Dải này nói thẳng, và khi quá hạn thì nó đổi hẳn giọng chứ không chỉ đổi màu.
 *
 * KỶ LUẬT MÀU: trạng thái cũ KHÔNG dùng --dau-do. Đỏ trong sản phẩm này chỉ có
 * một nghĩa là neo trích dẫn. Cảnh báo ở đây mang bằng chữ và bằng nền khay
 * đậm hơn — và nói cho đúng thì tin cũ không phải lỗi, chỉ là một sự thật cần
 * nói ra.
 */

import { Nut } from "@/components/kit/co-ban";
import { cn } from "@/lib/utils";
import type { DoTuoi } from "./dong-thoi-gian";

export interface KetQuaDongBo {
  source: string;
  status: string;
  inserted?: number;
  error?: string | null;
}

export function DaiTrangThai({
  doTuoi,
  soBai,
  nguon,
  dangDongBo,
  ketQua,
  loi,
  onDongBo,
}: {
  doTuoi: DoTuoi;
  soBai: number;
  nguon: { slug: string; name: string }[];
  dangDongBo: boolean;
  ketQua: KetQuaDongBo[] | null;
  loi: string | null;
  onDongBo: () => void;
}) {
  const cu = doTuoi.mucDo === "cu";
  const hong = ketQua?.filter((r) => r.status !== "ok") ?? [];
  const them = ketQua?.reduce((t, r) => t + (r.inserted ?? 0), 0) ?? 0;

  /* API đồng bộ trả slug ("thanh-nien"). Slug là tên nội bộ; người đọc biết
     tờ báo qua tên của nó. Đổi lại bằng danh mục nguồn trang đã có sẵn. */
  const tenNguon = (slug: string) => nguon.find((n) => n.slug === slug)?.name ?? slug;

  return (
    <div
      className={cn(
        "rounded-[--bo-lon] px-4 py-3 transition-colors duration-[--nhip]",
        cu ? "bg-khay-sau" : "bg-giay shadow-the ring-1 ring-muc-in/[0.035]",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            doTuoi.mucDo === "moi" ? "bg-but-xanh nhip-tho" : cu ? "bg-nhan" : "bg-but-xanh/60",
          )}
        />

        <p className="min-w-0 text-sm leading-[--dong-body]">
          {cu ? (
            <>
              <strong className="font-semibold">Dòng tin chưa được cập nhật.</strong>{" "}
              <span className="text-muc-mo">
                Bài mới nhất đã {doTuoi.moTa}. Các nguồn đăng bài liên tục trong ngày, nên khoảng
                lặng này là do việc lấy tin dừng lại chứ không phải báo ngừng đăng.
              </span>
            </>
          ) : (
            <>
              <strong className="font-semibold">Bài mới nhất {doTuoi.moTa}.</strong>{" "}
              <span className="text-muc-mo">
                {soBai.toLocaleString("vi-VN")} bài từ {nguon.length} nguồn.
              </span>
            </>
          )}
        </p>

        <div className="ml-auto shrink-0">
          <Nut
            kieu={cu ? "chinh" : "vien"}
            co="nho"
            disabled={dangDongBo}
            onClick={onDongBo}
          >
            {dangDongBo ? "Đang lấy tin…" : "Cập nhật ngay"}
          </Nut>
        </div>
      </div>

      {loi ? (
        <p className="mt-2 border-t border-ke-mo pt-2 text-[0.8125rem] leading-relaxed text-muc-mo">
          {loi}
        </p>
      ) : null}

      {/*
        Kết quả từng nguồn, không gộp thành một chữ "xong".
        Thanh Niên đang trả HTTP 500 ở phía họ; gộp lại thì người dùng tưởng đã
        có đủ ba nguồn trong khi thật ra thiếu một.
      */}
      {ketQua ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ke-mo pt-2 text-[0.8125rem]">
          <span className="text-muc-mo">
            Thêm {them} bài mới.
          </span>
          {hong.length > 0 ? (
            <span className="text-muc-mo">
              Không lấy được từ{" "}
              <strong className="font-semibold">
                {hong.map((r) => tenNguon(r.source)).join(", ")}
              </strong>
              {hong[0]?.error ? ` — ${hong[0].error}` : null}
            </span>
          ) : (
            <span className="text-muc-mo">Cả {ketQua.length} nguồn đều phản hồi.</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
