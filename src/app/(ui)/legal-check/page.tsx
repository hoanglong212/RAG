"use client";

/**
 * Kiểm tra tình huống pháp luật.
 *
 * Chữ nghĩa ở trang này phải cẩn thận: hệ thống TRÌNH BÀY QUY ĐỊNH, KHÔNG
 * PHÁN QUYẾT. Không viết "bạn sẽ bị phạt", chỉ nêu hành vi liên quan tới điều
 * nào và điều đó quy định gì.
 *
 * KHÔNG còn ô chọn chủ đề. Bộ phân loại đoán sai thường xuyên, mà bắt người
 * dùng tự xếp tình huống của mình vào một trong năm lĩnh vực là hỏi ngược
 * đúng thứ họ đang đi tìm câu trả lời. Giờ hệ thống tự nhận diện, không
 * trúng chủ đề nào thì tìm trên toàn kho và để ngưỡng điểm quyết định.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText } from "lucide-react";
import { KhungTrang, Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { OVanBanTuGian } from "@/components/kit/truong";
import { BaoLoi } from "@/components/kit/trang-thai-kit";
import { docLoi, guiJson } from "@/components/kit/goi-api";
import { PhanTichTinhHuong } from "@/components/phan-tich-tinh-huong";
import { DanhSachCanCu } from "@/components/danh-sach-can-cu";
import type { LegalCheckResult } from "@/lib/legal/check";
import { NHAN_CHU_DE_TIN, NHAN_KET_QUA_PHAP_LY } from "@/types/nhan-news";

const VI_DU =
  "Ngày 05/8/2026, Nam mượn xe máy của Hùng trong 3 ngày để về quê. Hùng giao cả xe lẫn giấy đăng ký bản gốc. Nam không về quê mà đem xe bán cho anh Minh với giá 45 triệu đồng…";

/** Thanh độ tin cậy. Xanh bút bi, không đỏ — đây không phải neo trích dẫn. */
function ThanhDiem({ diem }: { diem: number }) {
  const phanTram = Math.max(2, Math.min(100, Math.round(diem * 100)));
  return (
    <div className="flex items-center gap-2.5">
      <span className="nhan-hoa">Điểm cao nhất</span>
      <span aria-hidden className="h-1.5 w-24 overflow-hidden rounded-full bg-khay-sau">
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
  const [ketQua, setKetQua] = useState<LegalCheckResult | null>(null);
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [daLuu, setDaLuu] = useState(false);

  const soChu = tinhHuong.trim().length;
  const duDai = soChu >= 10;

  /** Tiêu đề hồ sơ lấy câu đầu của mô tả — người dùng sửa lại được ở trang Hồ sơ. */
  function datTen(mo: string): string {
    const cau = mo.trim().split(/(?<=[.!?])\s|\n/)[0] ?? mo;
    return cau.replace(/^Tình huống:\s*/i, "").trim().slice(0, 120) || "Hồ sơ chưa đặt tên";
  }

  async function luuHoSo() {
    if (!ketQua) return;
    setDangLuu(true);
    setLoi(null);
    try {
      await guiJson("/api/cases", {
        title: datTen(tinhHuong),
        scenario: tinhHuong.trim(),
        topic: ketQua.detectedTopics[0] ?? null,
        analysis: {
          status: ketQua.status,
          answer: ketQua.answer,
          phanTich: ketQua.phanTich,
          citations: ketQua.citations,
          topScore: ketQua.topScore,
          detectedTopics: ketQua.detectedTopics,
          missingFacts: [],
          nextSteps: [],
          disclaimer: ketQua.disclaimer,
        },
      });
      setDaLuu(true);
    } catch (e) {
      setLoi(docLoi(e));
    } finally {
      setDangLuu(false);
    }
  }

  async function gui() {
    if (!duDai) {
      setLoi("Mô tả còn quá ngắn để tìm căn cứ. Hãy viết rõ hơn diễn biến sự việc.");
      return;
    }
    setDangChay(true);
    setLoi(null);
    setKetQua(null);
    setDaLuu(false);
    try {
      setKetQua(
        await guiJson<LegalCheckResult>("/api/legal-check", { scenario: tinhHuong.trim() }),
      );
    } catch (e) {
      setLoi(docLoi(e));
    } finally {
      setDangChay(false);
    }
  }

  return (
    <KhungTrang
      tieuDe="Kiểm tra tình huống pháp luật"
      moTa="Kể lại sự việc theo trình tự thời gian, bằng ngôn ngữ thường. Hệ thống tự nhận diện lĩnh vực, tìm điều khoản liên quan và chỉ kết luận khi có căn cứ trích dẫn được."
    >
      <div className="flex flex-col gap-3">
        <The className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="tinh-huong" className="nhan-hoa">
              Diễn biến sự việc
            </label>
            <OVanBanTuGian
              id="tinh-huong"
              rows={6}
              value={tinhHuong}
              onChange={(e) => setTinhHuong(e.target.value)}
              onKeyDown={(e) => {
                // Ctrl/Cmd + Enter gửi; Enter thường vẫn xuống dòng vì đây là
                // văn bản dài nhiều đoạn, không phải ô hỏi một câu.
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (duDai && !dangChay) void gui();
                }
              }}
              placeholder={`Càng nhiều mốc thời gian và con số, kết quả càng bám sát.\n\nVí dụ: ${VI_DU}`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {tinhHuong.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setTinhHuong(VI_DU)}
                  className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-but-xanh underline-offset-4 hover:underline"
                >
                  <ScrollText className="size-3.5" strokeWidth={1.9} />
                  Điền một ví dụ
                </button>
              ) : (
                <span className="so-hieu text-xs tabular-nums text-nhan">
                  {soChu.toLocaleString("vi-VN")} ký tự
                </span>
              )}
              <span className="hidden text-xs text-nhan sm:inline">
                <kbd className="font-ma">Ctrl</kbd> + <kbd className="font-ma">Enter</kbd> để
                kiểm tra
              </span>
            </div>

            <Nut disabled={dangChay || !duDai} onClick={() => void gui()}>
              {dangChay ? "Đang tìm căn cứ…" : "Kiểm tra với pháp luật"}
            </Nut>
          </div>
        </The>

        {loi ? <BaoLoi tieuDe="Chưa kiểm tra được" moTa={loi} /> : null}

        {/* Bản phân tích đứng RIÊNG và đứng TRƯỚC khối kỹ thuật: người dùng
            tới đây để biết mình nên làm gì, không phải để đọc trạng thái
            truy hồi. */}
        {ketQua?.phanTich ? (
          <PhanTichTinhHuong
            phanTich={ketQua.phanTich}
            citations={ketQua.citations}
            onMoCanCu={(c) => router.push(`/documents/${c.documentId}?node=${c.nodeId}`)}
          />
        ) : null}

        {/*
          Lưu về Hồ sơ. Đây là cầu nối duy nhất giữa hai trang: phân tích ở
          đây, cất giữ ở kia. Trước đây trang Hồ sơ có ô phân tích riêng —
          cùng một việc làm hai chỗ, và bản ở kia luôn cũ hơn.
        */}
        {ketQua && (ketQua.phanTich || ketQua.citations.length > 0) ? (
          <The className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
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
              <Nut kieu="phu" disabled={dangLuu} onClick={() => void luuHoSo()}>
                {dangLuu ? "Đang lưu…" : "Lưu vào hồ sơ"}
              </Nut>
            )}
          </The>
        ) : null}

        {/* Không có bản phân tích thì phải nói vì sao. Người dùng cần biết
            đây là tạm thời (hết hạn mức) hay là giới hạn thật của hệ thống. */}
        {ketQua?.loiPhanTich ? (
          <div className="rounded-[--bo-lon] bg-khay-sau px-4 py-3.5 shadow-the">
            <p className="text-sm font-semibold">Chưa dựng được bản phân tích</p>
            <p className="mt-1.5 text-sm leading-relaxed text-nhan">{ketQua.loiPhanTich}</p>
          </div>
        ) : null}

        {ketQua ? (
          <The className="flex flex-col gap-5">
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

            {/* Văn xuôi chỉ còn là phương án dự phòng khi mô hình không trả
                đúng khuôn phân tích. */}
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
                    onMo={(c) => router.push(`/documents/${c.documentId}?node=${c.nodeId}`)}
                  />
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
