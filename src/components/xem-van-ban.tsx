"use client";

/**
 * Xem một văn bản: trục bên trái, mặt đọc bên phải.
 * Bấm một Điều trên trục thì mặt đọc cuộn tới đúng chỗ và ngược lại.
 */

import { useState } from "react";
import type { DocumentDetail } from "@/types/contract";
import { NHAN_CANH_BAO } from "@/types/nhan";
import { MatDoc } from "@/components/mat-doc";
import { TrucVanBan } from "@/components/truc-van-ban";

export function XemVanBan({ chiTiet }: { chiTiet: DocumentDetail }) {
  const [nodeDangChon, setNodeDangChon] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      <TrucVanBan
        soHieu={chiTiet.soHieu}
        tree={chiTiet.tree}
        nodeIdDangNeo={nodeDangChon}
        moRong
        onChon={setNodeDangChon}
        className="hidden shrink-0 md:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 px-6 pb-3 pt-3">
          <h1 className="text-base font-semibold">{chiTiet.trichYeu}</h1>
          <p className="mt-1 text-[0.8125rem] text-nhan">
            {chiTiet.coQuan}
            {chiTiet.ngayBanHanh ? ` · ${chiTiet.ngayBanHanh}` : ""}
          </p>

          {chiTiet.warnings.length > 0 ? (
            <section className="mt-3 rounded-[--bo] bg-khay-sau/70 px-3 py-2.5">
              <h2 className="nhan-hoa">
                Cảnh báo khi bóc tách ({chiTiet.warnings.length})
              </h2>
              <ul className="mt-1.5 flex flex-col gap-1">
                {chiTiet.warnings.map((cb, i) => (
                  <li key={`${cb.code}-${i}`} className="text-[0.8125rem] leading-snug">
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
        </div>

        <MatDoc
          tree={chiTiet.tree}
          nodeIdDangNeo={nodeDangChon}
          className="min-h-0 flex-1"
        />
      </div>
    </div>
  );
}
