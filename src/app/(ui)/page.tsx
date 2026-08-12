"use client";

/**
 * Trang tra cứu — màn hình chính.
 *
 * KHOẢNH KHẮC CHỮ KÝ, giờ chạy trên dữ liệu thật: /api/chat gửi sự kiện
 * `citations` TRƯỚC rồi mới tới `token`. Ngay khi nguồn về, trục văn bản nạp
 * cây của văn bản được trích, cuộn tới đúng Điều và đóng dấu đỏ — trong lúc
 * câu trả lời còn chưa có chữ nào. Chỗ đến có trước, lời giải thích tới sau.
 *
 * Trích dẫn KHÔNG điều hướng sang trang khác nữa. Rời trang là mất câu trả
 * lời, mà việc của người dùng là đối chiếu câu trả lời với văn bản gốc — hai
 * thứ đó phải nhìn thấy cùng lúc.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatStatus, Citation, DocumentDetail, StatsResponse } from "@/types/contract";
import type { ResearchProgress, ResearchSource } from "@/types/research";
import { CauTraLoi } from "@/components/cau-tra-loi";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { NguonNghienCuu } from "@/components/nguon-nghien-cuu";
import { MatDoc } from "@/components/mat-doc";
import { OHoi } from "@/components/o-hoi";
import { TrucVanBan } from "@/components/truc-van-ban";
import { DangTai, KhongTimThay, TrangThaiLoi, TrangThaiRong } from "@/components/trang-thai";
import { cn } from "@/lib/utils";

type Pha = "rong" | "dangTim" | "coNguon" | "xong" | "khongTimThay" | "loi";

/** Mặt đọc kèm đầu đề chỉ rõ đang mở ở đâu. Dùng chung cho cột tĩnh và tấm trượt. */
function MatDocCoDau({
  vanBan,
  dangChon,
  onDong,
}: {
  vanBan: DocumentDetail;
  dangChon: Citation;
  onDong?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-giay">
      <div className="flex shrink-0 items-baseline justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <p className="so-hieu truncate text-nhan">{dangChon.soHieu}</p>
          <p className="mt-0.5 truncate text-[0.8125rem] text-nhan">{dangChon.breadcrumb}</p>
        </div>
        {onDong ? (
          <button
            type="button"
            onClick={onDong}
            className="shrink-0 rounded-[--bo] px-2 py-1 text-sm font-medium text-but-xanh"
          >
            Đóng
          </button>
        ) : null}
      </div>
      <MatDoc tree={vanBan.tree} nodeIdDangNeo={dangChon.nodeId} className="min-h-0 flex-1" />
    </div>
  );
}

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
  const [dangChon, setDangChon] = useState<Citation | null>(null);
  const [topScore, setTopScore] = useState(0);
  const [nguong, setNguong] = useState(0.35);
  const [soVanBan, setSoVanBan] = useState(0);
  const [soChunk, setSoChunk] = useState(0);
  const [dangChay, setDangChay] = useState(false);
  const [matDocMo, setMatDocMo] = useState(false);
  const [cheDo, setCheDo] = useState<"corpus" | "research">("corpus");
  const [researchSources, setResearchSources] = useState<ResearchSource[]>([]);
  const [researchProgress, setResearchProgress] = useState<ResearchProgress | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);

  /** Cây văn bản của trích dẫn đang chọn, nạp theo nhu cầu và nhớ lại. */
  const [vanBan, setVanBan] = useState<DocumentDetail | null>(null);
  const kho = useRef(new Map<string, DocumentDetail>());

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d: StatsResponse) => {
        setSoVanBan(d.tongVanBan);
        setSoChunk(d.tongChunk);
      })
      .catch(() => undefined);
  }, []);

  /** Nạp cây cho trục và mặt đọc. Trục phải hiện được sớm nhất có thể. */
  const moTrichDan = useCallback(async (td: Citation, moTam = false) => {
    setDangChon(td);
    if (moTam) setMatDocMo(true);
    const daCo = kho.current.get(td.documentId);
    if (daCo) {
      setVanBan(daCo);
      return;
    }
    try {
      const r = await fetch(`/api/documents/${encodeURIComponent(td.documentId)}`);
      if (!r.ok) return;
      const chiTiet = (await r.json()) as DocumentDetail;
      kho.current.set(td.documentId, chiTiet);
      setVanBan((hienTai) => (td.documentId === chiTiet.id ? chiTiet : hienTai));
    } catch {
      /* Không nạp được cây thì câu trả lời vẫn dùng được, chỉ mất trục. */
    }
  }, []);

  const traCuu = useCallback(async () => {
    if (!cauHoi.trim()) return;
    setDangChay(true);
    setPha("dangTim");
    setAnswer("");
    setCitations([]);
    setResearchSources([]);
    setResearchProgress(null);
    setResearchError(null);
    setDangChon(null);
    setVanBan(null);
    setMatDocMo(false);

    try {
      const response = await fetch(cheDo === "research" ? "/api/research" : "/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: cauHoi, strategy: "structural", mode: "hybrid" }),
      });
      if (!response.ok || !response.body) throw new Error("Máy chủ không trả luồng dữ liệu.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) xuLySuKien(frame);
        if (done) break;
      }
    } catch {
      setPha("loi");
    } finally {
      setDangChay(false);
    }

    function xuLySuKien(frame: string) {
      const event = frame.match(/^event:\s*(.+)$/m)?.[1];
      const raw = frame.match(/^data:\s*(.+)$/m)?.[1];
      if (!event || !raw) return;
      const data = JSON.parse(raw) as Record<string, unknown>;

      if (event === "citations") {
        const next = (data.citations ?? []) as Citation[];
        setCitations(next);
        if (next.length > 0) {
          setPha("coNguon");
          // Nguồn về trước: trục nạp cây và đóng dấu ngay, chữ chưa có.
          void moTrichDan(next[0]);
        }
      } else if (event === "research_progress") {
        setResearchProgress(data as unknown as ResearchProgress);
      } else if (event === "research_sources") {
        const next = (data.sources ?? []) as ResearchSource[];
        const local = next.filter((source) => source.kind === "corpus").map(sourceToCitation);
        setResearchSources(next);
        setCitations(local);
        if (next.length > 0) setPha("coNguon");
        if (local[0]) void moTrichDan(local[0]);
      } else if (event === "research_error") {
        setResearchError(String(data.message ?? "Không thể hoàn tất nghiên cứu sâu."));
      } else if (event === "token") {
        setPha("xong");
        setAnswer((cu) => cu + String(data.text ?? ""));
      } else if (event === "done") {
        const status = data.status as ChatStatus;
        setTopScore(Number(data.topScore ?? 0));
        setNguong(Number(data.nguong ?? 0.35));
        setPha(status === "ok" ? "xong" : status === "khong_tim_thay" ? "khongTimThay" : "loi");
      }
    }
  }, [cauHoi, cheDo, moTrichDan]);

  const sourcesCount = cheDo === "research" ? researchSources.length : citations.length;
  const coNguon = (pha === "coNguon" || pha === "xong") && sourcesCount > 0;
  const soDangChon = dangChon
    ? (cheDo === "research"
        ? researchSources.findIndex((source) => source.chunkId === dangChon.chunkId)
        : citations.findIndex((c) => c.chunkId === dangChon.chunkId)) + 1
    : 0;

  const doiCheDo = (next: "corpus" | "research") => {
    if (next === cheDo || dangChay) return;
    setCheDo(next);
    setPha("rong");
    setAnswer("");
    setCitations([]);
    setResearchSources([]);
    setResearchProgress(null);
    setResearchError(null);
    setDangChon(null);
    setVanBan(null);
    setMatDocMo(false);
  };

  const moNguonTheoSo = (so: number) => {
    if (cheDo === "corpus") {
      const citation = citations[so - 1];
      if (citation) void moTrichDan(citation, true);
      return;
    }
    const source = researchSources[so - 1];
    if (!source) return;
    if (source.kind === "corpus") {
      void moTrichDan(sourceToCitation(source), true);
    } else if (source.url) {
      window.open(source.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex h-full">
      {/* ---------- Cột trái: trục văn bản ---------- */}
      {vanBan ? (
        <TrucVanBan
          soHieu={vanBan.soHieu}
          tree={vanBan.tree}
          nodeIdDangNeo={dangChon?.nodeId ?? null}
          onChon={(nodeId) => {
            const td = citations.find((c) => c.nodeId === nodeId);
            if (td) void moTrichDan(td, true);
          }}
          className="shrink-0"
        />
      ) : (
        <div className="hidden w-14 shrink-0 flex-col px-2 pt-4 lg:flex lg:w-52 lg:px-3 xl:w-72">
          <p className="nhan-hoa text-center lg:text-left">
            <span className="lg:hidden">Trục</span>
            <span className="hidden lg:inline">Trục văn bản</span>
          </p>
          <p className="mt-2 hidden text-[0.8125rem] leading-relaxed text-nhan lg:block">
            Khi có câu trả lời, trục dựng cây Chương — Điều của văn bản được trích và
            cuộn tới đúng chỗ.
          </p>
        </div>
      )}

      {/* ---------- Cột giữa: hỏi và đáp ---------- */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6">
        {/* Lúc chưa có văn bản, cột này được rộng hơn vì cột mặt đọc chưa dựng. */}
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col",
            vanBan ? "max-w-2xl" : "max-w-3xl",
          )}
        >
          <OHoi
            giaTri={cauHoi}
            onDoi={setCauHoi}
            onTraCuu={traCuu}
            dangChay={dangChay}
            cheDo={cheDo}
            onDoiCheDo={doiCheDo}
          />

          <div className="mt-7 flex-1">
            {pha === "rong" ? (
              <TrangThaiRong
                cauHoiGoiY={CAU_HOI_GOI_Y}
                onChonCauHoi={setCauHoi}
                tongVanBan={soVanBan}
                tongChunk={soChunk}
              />
            ) : null}
            {pha === "dangTim" ? (
              <DangTai researchMode={cheDo === "research"} progress={researchProgress} />
            ) : null}
            {pha === "khongTimThay" ? (
              <KhongTimThay
                topScore={topScore}
                nguong={nguong}
                soVanBan={soVanBan}
                researchMode={cheDo === "research"}
              />
            ) : null}
            {pha === "loi" ? <TrangThaiLoi onThuLai={traCuu} message={researchError ?? undefined} /> : null}

            {coNguon ? (
              <div className="flex flex-col gap-7">
                {/* Nguồn đứng TRÊN câu trả lời, đúng thứ tự chúng về. */}
                <section>
                  <h2 className="nhan-hoa mb-2.5">Nguồn ({sourcesCount})</h2>
                  <ul className="flex flex-col gap-1.5">
                    {cheDo === "research"
                      ? researchSources.map((source, index) => (
                          <li key={source.id}>
                            <NguonNghienCuu
                              source={source}
                              index={index + 1}
                              selected={Boolean(source.chunkId && source.chunkId === dangChon?.chunkId)}
                              onSelect={() => {
                                if (source.kind === "corpus") void moTrichDan(sourceToCitation(source), true);
                              }}
                            />
                          </li>
                        ))
                      : citations.map((td, i) => (
                          <li key={td.chunkId}>
                            <ChipTrichDan
                              trichDan={td}
                              soThuTu={i + 1}
                              dangChon={dangChon?.chunkId === td.chunkId}
                              onChon={(c) => void moTrichDan(c, true)}
                            />
                          </li>
                        ))}
                  </ul>
                </section>

                <section>
                  <h2 className="nhan-hoa mb-2.5">Trả lời</h2>
                  {answer ? (
                    <CauTraLoi
                      noiDung={answer}
                      soTrichDan={sourcesCount}
                      dangChon={soDangChon || undefined}
                      dangViet={dangChay}
                      onChonSo={moNguonTheoSo}
                    />
                  ) : (
                    <p className="text-sm text-nhan">Đang soạn câu trả lời…</p>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* ---------- Cột phải: mặt đọc ----------
          Từ 1280px là cột thứ ba cố định; hẹp hơn thì thành tấm trượt. */}
      {matDocMo ? (
        <button
          type="button"
          aria-label="Đóng văn bản gốc"
          onClick={() => setMatDocMo(false)}
          className="fixed inset-0 z-30 bg-muc-in/25 xl:hidden"
        />
      ) : null}

      {/* Từ 1280px: cột thứ ba tĩnh, KHÔNG transform. Lớp `fixed` kèm
          `translate` sinh một tầng hợp thành thừa mà bề ngang này không cần. */}
      {vanBan && dangChon ? (
        <div className="hidden xl:block xl:w-[32rem] xl:shrink-0 2xl:w-[38rem]">
          <MatDocCoDau vanBan={vanBan} dangChon={dangChon} />
        </div>
      ) : null}

      {/* Dưới 1280px: tấm trượt. */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-full max-w-xl shadow-noi xl:hidden",
          "transition-transform duration-[--nhip-cham] [transition-timing-function:var(--duong-cong)]",
          matDocMo ? "translate-x-0" : "translate-x-full",
        )}
      >
        {vanBan && dangChon ? (
          <MatDocCoDau
            vanBan={vanBan}
            dangChon={dangChon}
            onDong={() => setMatDocMo(false)}
          />
        ) : null}
      </div>
    </div>
  );
}

function sourceToCitation(source: ResearchSource): Citation {
  return {
    chunkId: source.chunkId ?? source.id,
    documentId: source.documentId ?? "",
    nodeId: source.nodeId ?? "",
    soHieu: source.soHieu ?? "Văn bản trong kho",
    breadcrumb: source.breadcrumb ?? source.title,
    trichDoan: source.excerpt,
    score: source.score,
  };
}
