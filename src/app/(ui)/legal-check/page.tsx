"use client";

/**
 * Kiểm tra tình huống pháp luật.
 *
 * Chữ nghĩa ở trang này phải cẩn thận: hệ thống TRÌNH BÀY QUY ĐỊNH, KHÔNG
 * PHÁN QUYẾT. Không viết "bạn sẽ bị phạt", chỉ nêu hành vi liên quan tới điều
 * nào và điều đó quy định gì. Dòng miễn trừ đứng ngay dưới kết quả chứ không
 * giấu ở chân trang.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { KhungTrang, Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { OVanBan, VienLoc } from "@/components/kit/truong";
import { BaoLoi } from "@/components/kit/trang-thai-kit";
import type { LegalCheckResult } from "@/lib/legal/check";
import type { NewsTopic } from "@/types/news";
import { NHAN_CHU_DE_TIN, NHAN_KET_QUA_PHAP_LY } from "@/types/nhan-news";

const CHU_DE_HO_TRO: NewsTopic[] = [
  "an_toan_thuc_pham",
  "lao_dong",
  "giao_thong",
  "dat_dai_nha_o",
  "nguoi_tieu_dung",
];

/** Thanh độ tin cậy. Xanh bút bi, không đỏ — đây không phải neo trích dẫn. */
function ThanhDiem({ diem }: { diem: number }) {
  const phanTram = Math.max(2, Math.min(100, Math.round(diem * 100)));
  return (
    <div className="flex items-center gap-2.5">
      <span className="nhan-hoa">Điểm cao nhất</span>
      <span
        aria-hidden
        className="h-1.5 w-24 overflow-hidden rounded-full bg-khay-sau"
      >
        <span
          className="block h-full rounded-full bg-but-xanh transition-[width] duration-[--nhip-cham]"
          style={{ width: `${phanTram}%` }}
        />
      </span>
      <span className="so-hieu text-nhan">{diem.toFixed(2).replace(".", ",")}</span>
    </div>
  );
}

export default function TrangKiemTraTinhHuong() {
  const router = useRouter();
  const [tinhHuong, setTinhHuong] = useState("");
  const [chuDe, setChuDe] = useState<NewsTopic | "">("");
  const [ketQua, setKetQua] = useState<LegalCheckResult | null>(null);
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  async function gui() {
    if (tinhHuong.trim().length < 10) {
      setLoi("Mô tả còn quá ngắn để tìm căn cứ. Hãy viết rõ hơn, ít nhất 10 ký tự.");
      return;
    }
    setDangChay(true);
    setLoi(null);
    setKetQua(null);
    try {
      const r = await fetch("/api/legal-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenario: tinhHuong.trim(), ...(chuDe ? { topic: chuDe } : {}) }),
      });
      const d = (await r.json()) as LegalCheckResult | { error?: string };
      if (!r.ok) throw new Error("error" in d ? d.error : "Không đối chiếu được tình huống.");
      setKetQua(d as LegalCheckResult);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không đối chiếu được tình huống.");
    } finally {
      setDangChay(false);
    }
  }

  return (
    <KhungTrang
      tieuDe="Kiểm tra tình huống pháp luật"
      moTa="Mô tả sự việc bằng ngôn ngữ thường. Hệ thống tìm dấu hiệu liên quan trong bộ văn bản và chỉ trả kết quả khi có căn cứ trích dẫn được."
    >
      <div className="flex flex-col gap-4">
        <The className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tinh-huong" className="nhan-hoa">
              Tình huống cần kiểm tra
            </label>
            <OVanBan
              id="tinh-huong"
              rows={7}
              value={tinhHuong}
              onChange={(e) => setTinhHuong(e.target.value)}
              placeholder="Ví dụ: Công ty đã chậm trả lương cho tôi hai tháng, tôi đã gửi đơn nhưng chưa được trả lời…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="nhan-hoa">Chủ đề</span>
            <VienLoc
              cacMuc={CHU_DE_HO_TRO.map((t) => ({ giaTri: t, nhan: NHAN_CHU_DE_TIN[t] }))}
              dangChon={chuDe}
              nhanTatCa="Tự nhận diện"
              onChon={setChuDe}
            />
          </div>

          <div className="flex justify-end">
            <Nut disabled={dangChay || tinhHuong.trim().length < 10} onClick={() => void gui()}>
              {dangChay ? "Đang tìm căn cứ…" : "Kiểm tra với pháp luật"}
            </Nut>
          </div>
        </The>

        {loi ? <BaoLoi tieuDe="Chưa kiểm tra được" moTa={loi} /> : null}

        {ketQua ? (
          <The className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">
                {NHAN_KET_QUA_PHAP_LY[ketQua.status]}
              </h2>
              <ThanhDiem diem={ketQua.topScore} />
            </div>

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
                <TieuDeMuc phu="Bấm để mở đúng Khoản trong văn bản gốc">
                  Căn cứ được truy hồi
                </TieuDeMuc>
                <div className="mt-2.5 grid gap-1.5 md:grid-cols-2">
                  {ketQua.citations.map((c, i) => (
                    <ChipTrichDan
                      key={c.chunkId}
                      trichDan={c}
                      soThuTu={i + 1}
                      onChon={() => router.push(`/documents/${c.documentId}?node=${c.nodeId}`)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <p className="border-t border-ke-mo pt-3.5 text-xs leading-relaxed text-nhan">
              {ketQua.disclaimer}
            </p>
          </The>
        ) : null}
      </div>
    </KhungTrang>
  );
}
