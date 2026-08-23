"use client";

/**
 * Kiểm tra tình huống pháp luật.
 *
 * Chữ nghĩa ở trang này phải cẩn thận: hệ thống TRÌNH BÀY QUY ĐỊNH, KHÔNG
 * PHÁN QUYẾT. Không viết "bạn sẽ bị phạt", chỉ nêu hành vi liên quan tới điều
 * nào và điều đó quy định gì.
 *
 * Tất cả giao diện đã được tách thành các component trong `@/components/kiem-tra`.
 */

import { useState } from "react";
import { KhungTrang } from "@/components/kit/co-ban";
import { BaoLoi } from "@/components/kit/trang-thai-kit";
import { docLoi, guiJson } from "@/components/kit/goi-api";
import type { LegalCheckResult } from "@/lib/legal/check";
import { ScenarioForm } from "@/components/kiem-tra/scenario-form";
import { AnalysisResult } from "@/components/kiem-tra/analysis-result";

export default function TrangKiemTraTinhHuong() {
  const [tinhHuong, setTinhHuong] = useState("");
  const [ketQua, setKetQua] = useState<LegalCheckResult | null>(null);
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [daLuu, setDaLuu] = useState(false);

  const soChu = tinhHuong.trim().length;
  const duDai = soChu >= 10;

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
        <ScenarioForm
          tinhHuong={tinhHuong}
          setTinhHuong={setTinhHuong}
          dangChay={dangChay}
          duDai={duDai}
          onGui={() => void gui()}
        />

        {loi ? <BaoLoi tieuDe="Chưa kiểm tra được" moTa={loi} /> : null}

        {ketQua ? (
          <AnalysisResult
            ketQua={ketQua}
            daLuu={daLuu}
            dangLuu={dangLuu}
            onLuuHoSo={() => void luuHoSo()}
          />
        ) : null}
      </div>
    </KhungTrang>
  );
}
