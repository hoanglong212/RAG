"use client";

/**
 * Xem một văn bản: trục bên trái, mặt đọc bên phải.
 * Bấm một Điều trên trục thì mặt đọc cuộn tới đúng chỗ và ngược lại.
 *
 * Đầu trang là khay công cụ (metadata, cảnh báo), thân trang là giấy. Ranh
 * giới hai nền chính là ranh giới giữa "thông tin về văn bản" và "văn bản".
 */

import { useState } from "react";
import type { DocumentDetail } from "@/types/contract";
import { NHAN_CANH_BAO, NHAN_LOAI, NHAN_TRANG_THAI, chuanHoaTenCoQuan } from "@/types/nhan";
import { MatDoc } from "@/components/mat-doc";
import { TrucVanBan } from "@/components/truc-van-ban";

export function XemVanBan({
  chiTiet,
  nodeBanDau = null,
}: {
  chiTiet: DocumentDetail;
  nodeBanDau?: string | null;
}) {
  const [nodeDangChon, setNodeDangChon] = useState<string | null>(nodeBanDau);

  const phu = [
    chuanHoaTenCoQuan(chiTiet.coQuan),
    NHAN_LOAI[chiTiet.loaiVanBan],
    chiTiet.ngayBanHanh
      ? `Ban hành ${new Date(chiTiet.ngayBanHanh).toLocaleDateString("vi-VN")}`
      : null,
    NHAN_TRANG_THAI[chiTiet.trangThai],
  ].filter(Boolean) as string[];

  return (
    <div className="flex h-full">
      <TrucVanBan
        soHieu={chiTiet.soHieu}
        tree={chiTiet.tree}
        nodeIdDangNeo={nodeDangChon}
        onChon={setNodeDangChon}
        className="shrink-0"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 px-5 pb-4 pt-4 sm:px-6">
          <p className="so-hieu text-nhan">{chiTiet.soHieu ?? "Không có số hiệu"}</p>
          <h1 className="mt-1 text-base font-semibold leading-snug">
            {chiTiet.trichYeu ?? "Chưa có trích yếu"}
          </h1>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-nhan">
            {phu.join(" · ")}
          </p>

          {chiTiet.warnings.length > 0 ? (
            <section className="mt-3.5 rounded-[--bo] bg-giay px-3.5 py-3 shadow-the">
              <h2 className="nhan-hoa">
                Cảnh báo khi bóc tách ({chiTiet.warnings.length})
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {chiTiet.warnings.map((cb, i) => (
                  <li key={`${cb.code}-${i}`} className="text-[0.8125rem] leading-relaxed">
                    <span className="font-medium">{NHAN_CANH_BAO[cb.code]}</span>
                    <span className="text-nhan"> — {cb.message}</span>
                    {cb.line ? (
                      <span className="so-hieu text-nhan"> (dòng {cb.line})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </header>

        <MatDoc tree={chiTiet.tree} nodeIdDangNeo={nodeDangChon} className="min-h-0 flex-1" />
      </div>
    </div>
  );
}
