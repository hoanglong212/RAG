"use client";

import { Printer, Trash2 } from "lucide-react";
import { Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { PhanTichTinhHuong } from "@/components/phan-tich-tinh-huong";
import { DanhSachCanCu } from "@/components/danh-sach-can-cu";
import type { LegalCaseView } from "@/types/platform";
import { DocumentGenerator } from "./document-generator";

function khiNao(iso: string): string {
  const giay = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (giay < 3600) return `${Math.max(1, Math.floor(giay / 60))} phút trước`;
  if (giay < 86400) return `${Math.floor(giay / 3600)} giờ trước`;
  if (giay < 604800) return `${Math.floor(giay / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function CaseDetail({
  vu,
  hoTen,
  xacNhanXoa,
  onHoiXoa,
  onHuyXoa,
  onXoa,
  onDoiTrangThai,
  onMoCanCu,
  onBaoLoi,
}: {
  vu: LegalCaseView;
  hoTen: string;
  xacNhanXoa: boolean;
  onHoiXoa: () => void;
  onHuyXoa: () => void;
  onXoa: () => void;
  onDoiTrangThai: (tt: "dang_lam" | "da_xong") => void;
  onMoCanCu: (c: { documentId: string; nodeId: string }) => void;
  onBaoLoi: (s: string) => void;
}) {
  const pt = vu.analysis?.phanTich ?? null;
  const canCu = vu.analysis?.citations ?? [];

  return (
    <div className="flex flex-col gap-3">
      <The className="flex flex-col gap-4 sang-khi-cham">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="nhan-hoa">
              Lưu {khiNao(vu.createdAt)} · Sửa {khiNao(vu.updatedAt)}
            </p>
            <h2 className="mt-1.5 text-lg font-semibold leading-snug">{vu.title}</h2>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">
            <Nut
              kieu={vu.status === "da_xong" ? "vien" : "phu"}
              co="nho"
              onClick={() => onDoiTrangThai(vu.status === "da_xong" ? "dang_lam" : "da_xong")}
            >
              {vu.status === "da_xong" ? "Mở lại" : "Đánh dấu xong"}
            </Nut>
            <Nut kieu="vien" co="nho" onClick={() => window.print()}>
              <Printer className="size-3.5" strokeWidth={1.9} />
              In
            </Nut>
            {xacNhanXoa ? (
              <>
                <Nut kieu="phu" co="nho" onClick={onXoa}>
                  Xoá thật
                </Nut>
                <Nut kieu="lang" co="nho" onClick={onHuyXoa}>
                  Thôi
                </Nut>
              </>
            ) : (
              <Nut kieu="lang" co="nho" onClick={onHoiXoa}>
                <Trash2 className="size-3.5" strokeWidth={1.9} />
                Xoá
              </Nut>
            )}
          </div>
        </div>

        <div>
          <p className="nhan-hoa">Sự việc đã ghi lại</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-nhan">
            {vu.scenario}
          </p>
        </div>
      </The>

      {pt ? (
        <PhanTichTinhHuong phanTich={pt} citations={canCu} onMoCanCu={onMoCanCu} />
      ) : vu.analysis?.answer ? (
        <The className="sang-khi-cham">
          <TieuDeMuc>Phân tích đã lưu</TieuDeMuc>
          <p className="mt-2.5 whitespace-pre-wrap text-base leading-[--dong-body]">
            {vu.analysis.answer}
          </p>
        </The>
      ) : null}

      {canCu.length > 0 ? (
        <The className="sang-khi-cham">
          <TieuDeMuc phu="Ảnh chụp tại thời điểm lưu, không đổi theo kho văn bản">
            Căn cứ đã lưu ({canCu.length})
          </TieuDeMuc>
          <div className="mt-2.5">
            <DanhSachCanCu citations={canCu} onMo={onMoCanCu} />
          </div>
        </The>
      ) : null}

      <DocumentGenerator vu={vu} hoTen={hoTen} onBaoLoi={onBaoLoi} />
    </div>
  );
}
