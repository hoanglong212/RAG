"use client";

import { useCallback, useEffect, useState } from "react";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { OHoi } from "@/components/o-hoi";
import { DangTai, KhongTimThay, TrangThaiLoi, TrangThaiRong } from "@/components/trang-thai";
import type { ChatStatus, Citation, StatsResponse } from "@/types/contract";

type Pha = "rong" | "dangTim" | "coNguon" | "xong" | "khongTimThay" | "loi";

const CAU_HOI_GOI_Y = [
  "Công ty chậm trả tiền lương cho người lao động thì bị xử lý thế nào?",
  "Người đi xe máy vượt đèn đỏ bị phạt theo quy định nào?",
  "Cửa hàng từ chối bảo hành sản phẩm lỗi có đúng pháp luật không?",
];

export default function TrangTraCuu() {
  const [cauHoi, setCauHoi] = useState("");
  const [pha, setPha] = useState<Pha>("rong");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [topScore, setTopScore] = useState(0);
  const [nguong, setNguong] = useState(0.35);
  const [soVanBan, setSoVanBan] = useState(0);
  const [dangChay, setDangChay] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((response) => response.json())
      .then((data: StatsResponse) => setSoVanBan(data.tongVanBan))
      .catch(() => undefined);
  }, []);

  const traCuu = useCallback(async () => {
    if (!cauHoi.trim()) return;
    setDangChay(true);
    setPha("dangTim");
    setAnswer("");
    setCitations([]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: cauHoi, strategy: "structural", mode: "hybrid" }),
      });
      if (!response.ok || !response.body) throw new Error("Máy chủ không trả luồng dữ liệu.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) handleEvent(frame);
        if (done) break;
      }
    } catch {
      setPha("loi");
    } finally {
      setDangChay(false);
    }
  }, [cauHoi]);

  function handleEvent(frame: string) {
    const event = frame.match(/^event:\s*(.+)$/m)?.[1];
    const raw = frame.match(/^data:\s*(.+)$/m)?.[1];
    if (!event || !raw) return;
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (event === "citations") {
      const next = (data.citations ?? []) as Citation[];
      setCitations(next);
      if (next.length > 0) setPha("coNguon");
    } else if (event === "token") {
      setPha("xong");
      setAnswer((current) => current + String(data.text ?? ""));
    } else if (event === "done") {
      const status = data.status as ChatStatus;
      setTopScore(Number(data.topScore ?? 0));
      setNguong(Number(data.nguong ?? 0.35));
      setPha(status === "ok" ? "xong" : status === "khong_tim_thay" ? "khongTimThay" : "loi");
    }
  }

  return (
    <main className="h-full overflow-y-auto px-5 py-4">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
        <OHoi giaTri={cauHoi} onDoi={setCauHoi} onTraCuu={traCuu} dangChay={dangChay} />

        <div className="mt-6 flex-1">
          {pha === "rong" ? <TrangThaiRong cauHoiGoiY={CAU_HOI_GOI_Y} onChonCauHoi={setCauHoi} /> : null}
          {pha === "dangTim" ? <DangTai /> : null}
          {pha === "khongTimThay" ? (
            <KhongTimThay topScore={topScore} nguong={nguong} soVanBan={soVanBan} />
          ) : null}
          {pha === "loi" ? <TrangThaiLoi onThuLai={traCuu} /> : null}

          {(pha === "coNguon" || pha === "xong") && citations.length > 0 ? (
            <div className="flex flex-col gap-6">
              <section>
                <h2 className="nhan-hoa mb-2">Nguồn ({citations.length})</h2>
                <ul className="flex flex-col gap-1.5">
                  {citations.map((citation, index) => (
                    <li key={citation.chunkId}>
                      <ChipTrichDan
                        trichDan={citation}
                        soThuTu={index + 1}
                        onChon={() => {
                          window.location.href = `/documents/${citation.documentId}?node=${citation.nodeId}`;
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="nhan-hoa mb-2">Trả lời</h2>
                <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">
                  {answer || "Đang soạn câu trả lời…"}
                </p>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
