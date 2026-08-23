"use client";

import { useRouter } from "next/navigation";
import { Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { VongTienTrinh } from "@/components/kit/vong-tien-trinh";
import { PhanTichTinhHuong } from "@/components/phan-tich-tinh-huong";
import { DanhSachCanCu } from "@/components/danh-sach-can-cu";
import type { LegalCheckResult } from "@/lib/legal/check";
import { NHAN_CHU_DE_TIN, NHAN_KET_QUA_PHAP_LY } from "@/types/nhan-news";

function ThanhDiem({ diem }: { diem: number }) {
  const phanTram = Math.max(2, Math.min(100, Math.round(diem * 100)));
  return (
    <div className="flex items-center gap-3">
      <VongTienTrinh
        phanTram={diem}
        co={42}
        doDay={3.5}
        mauNen="var(--khay-sau)"
        mauVach="var(--but-xanh)"
        nhan={`${phanTram}%`}
      />
      <div>
        <span className="nhan-hoa block">Độ tin cậy</span>
        <span className="so-hieu text-xs font-semibold text-muc-in">
          {diem.toFixed(2).replace(".", ",")}
        </span>
      </div>
    </div>
  );
}

export function AnalysisResult({
  ketQua,
  daLuu,
  dangLuu,
  onLuuHoSo,
}: {
  ketQua: LegalCheckResult;
  daLuu: boolean;
  dangLuu: boolean;
  onLuuHoSo: () => void;
}) {
  const router = useRouter();

  const handleOpenDoc = (c: { documentId: string; nodeId: string }) => {
    router.push(`/documents/${c.documentId}?node=${c.nodeId}`);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Bản phân tích */}
      {ketQua.phanTich ? (
        <PhanTichTinhHuong
          phanTich={ketQua.phanTich}
          citations={ketQua.citations}
          onMoCanCu={handleOpenDoc}
        />
      ) : null}

      {/* Lưu vào Hồ sơ */}
      {ketQua.phanTich || ketQua.citations.length > 0 ? (
        <The className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 sang-khi-cham">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Giữ lại vụ việc này</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-nhan">
              Hồ sơ lưu nguyên bản phân tích và căn cứ của lần chạy này, kể cả khi kho
              văn bản thay đổi về sau.
            </p>
          </div>
          {daLuu ? (
            <Nut kieu="vien" onClick={() => router.push("/workspace")}>
              Mở trong Hồ sơ
            </Nut>
          ) : (
            <Nut kieu="phu" disabled={dangLuu} onClick={onLuuHoSo}>
              {dangLuu ? "Đang lưu…" : "Lưu vào hồ sơ"}
            </Nut>
          )}
        </The>
      ) : null}

      {/* Lỗi phân tích nếu có */}
      {ketQua.loiPhanTich ? (
        <div className="rounded-[--bo-lon] bg-khay-sau px-4 py-3.5 shadow-the">
          <p className="text-sm font-semibold">Chưa dựng được bản phân tích</p>
          <p className="mt-1.5 text-sm leading-relaxed text-nhan">{ketQua.loiPhanTich}</p>
        </div>
      ) : null}

      {/* Chi tiết kết quả & căn cứ */}
      <The className="flex flex-col gap-5 sang-khi-cham">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            {NHAN_KET_QUA_PHAP_LY[ketQua.status]}
          </h2>
          <ThanhDiem diem={ketQua.topScore} />
        </div>

        {ketQua.detectedTopics.length > 0 ? (
          <p className="text-sm leading-relaxed text-nhan">
            Hệ thống nhận diện tình huống này thuộc{" "}
            <span className="font-medium text-muc-in">
              {ketQua.detectedTopics
                .map((t) => NHAN_CHU_DE_TIN[t] ?? t)
                .join(", ")}
            </span>
            .
          </p>
        ) : null}

        {ketQua.answer ? (
          <p className="whitespace-pre-wrap text-base leading-[--dong-body]">
            {ketQua.answer}
          </p>
        ) : null}

        {ketQua.matchedRules.length > 0 ? (
          <section>
            <TieuDeMuc phu="Cụm từ trong mô tả khớp với bộ quy tắc có kiểm chứng">
              Dấu hiệu nhận diện được
            </TieuDeMuc>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {ketQua.matchedRules.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-[--bo] bg-khay px-3.5 py-2.5 text-sm"
                >
                  <span className="font-medium">{r.label}</span>
                  <span className="so-hieu text-xs text-nhan">
                    {r.source.soHieu} · Điều {r.source.dieu}
                    {r.source.khoan ? ` · Khoản ${r.source.khoan}` : ""}
                    {r.source.diem ? ` · Điểm ${r.source.diem}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {ketQua.citations.length > 0 ? (
          <section>
            <TieuDeMuc phu="Bấm một dòng để đọc nguyên văn, hoặc mở thẳng văn bản gốc">
              Căn cứ được truy hồi ({ketQua.citations.length})
            </TieuDeMuc>
            <div className="mt-2.5">
              <DanhSachCanCu
                citations={ketQua.citations}
                onMo={handleOpenDoc}
              />
            </div>
          </section>
        ) : null}

        <p className="border-t border-ke-mo pt-3.5 text-xs leading-relaxed text-nhan">
          {ketQua.disclaimer}
        </p>
      </The>
    </div>
  );
}
