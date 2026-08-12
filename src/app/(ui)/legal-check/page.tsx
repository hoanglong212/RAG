"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
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

export default function TrangKiemTraTinhHuong() {
  const router = useRouter();
  const [scenario, setScenario] = useState("");
  const [topic, setTopic] = useState<NewsTopic | "">("");
  const [result, setResult] = useState<LegalCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  async function submit() {
    if (scenario.trim().length < 10) {
      setLoi("Hãy mô tả tình huống rõ hơn, tối thiểu 10 ký tự.");
      return;
    }
    setLoading(true);
    setLoi(null);
    setResult(null);
    try {
      const response = await fetch("/api/legal-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenario: scenario.trim(), ...(topic ? { topic } : {}) }),
      });
      const data = (await response.json()) as LegalCheckResult | { error?: string };
      if (!response.ok) throw new Error("error" in data ? data.error : "Không đối chiếu được tình huống.");
      setResult(data as LegalCheckResult);
    } catch (error) {
      setLoi(error instanceof Error ? error.message : "Không đối chiếu được tình huống.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-lg font-semibold">Kiểm tra tình huống pháp luật</h1>
        <p className="mt-1 text-sm leading-relaxed text-nhan">
          Mô tả sự việc bằng ngôn ngữ thường. Hệ thống tìm dấu hiệu liên quan và chỉ trả kết quả khi có căn cứ trong corpus.
        </p>

        <div className="mt-5 rounded-[--bo-lon] bg-giay p-4">
          <label htmlFor="scenario" className="nhan-hoa">Tình huống cần kiểm tra</label>
          <textarea
            id="scenario"
            rows={7}
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            placeholder="Ví dụ: Công ty đã chậm trả lương cho tôi hai tháng…"
            className="mt-2 w-full resize-y rounded-[--bo] bg-khay px-3.5 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-but-xanh/30"
          />
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <label className="text-sm text-nhan">
              Chủ đề (không bắt buộc)
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value as NewsTopic | "")}
                className="mt-1 block min-w-56 rounded-[--bo] bg-khay px-3 py-2 text-sm text-muc-in"
              >
                <option value="">Tự nhận diện</option>
                {CHU_DE_HO_TRO.map((item) => <option key={item} value={item}>{NHAN_CHU_DE_TIN[item]}</option>)}
              </select>
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit()}
              className="rounded-[--bo] bg-but-xanh px-4 py-2.5 text-sm font-medium text-giay disabled:opacity-50"
            >
              {loading ? "Đang tìm căn cứ…" : "Kiểm tra với pháp luật"}
            </button>
          </div>
        </div>

        {loi ? <p className="mt-3 rounded-[--bo] bg-khay-sau px-3 py-2 text-sm text-dau-do">{loi}</p> : null}

        {result ? (
          <section className="mt-5 rounded-[--bo-lon] bg-giay p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{NHAN_KET_QUA_PHAP_LY[result.status]}</h2>
              <span className="so-hieu text-xs text-nhan">Điểm cao nhất {result.topScore.toFixed(2)}</span>
            </div>
            {result.answer ? <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{result.answer}</p> : null}
            {result.matchedRules.length > 0 ? (
              <div className="mt-4">
                <h3 className="nhan-hoa">Dấu hiệu nhận diện được</h3>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                  {result.matchedRules.map((rule) => (
                    <li key={rule.id} className="rounded-[--bo] bg-khay px-3 py-2">
                      {rule.label}
                      <span className="so-hieu ml-2 text-xs text-nhan">
                        {rule.source.soHieu} · Điều {rule.source.dieu}
                        {rule.source.khoan ? ` · Khoản ${rule.source.khoan}` : ""}
                        {rule.source.diem ? ` · Điểm ${rule.source.diem}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.citations.length > 0 ? (
              <div className="mt-4">
                <h3 className="nhan-hoa">Căn cứ được truy hồi</h3>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {result.citations.map((citation, index) => (
                    <ChipTrichDan
                      key={citation.chunkId}
                      trichDan={citation}
                      soThuTu={index + 1}
                      onChon={() => router.push(`/documents/${citation.documentId}?node=${citation.nodeId}`)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <p className="mt-4 border-t border-ke-mo pt-3 text-xs leading-relaxed text-nhan">{result.disclaimer}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
