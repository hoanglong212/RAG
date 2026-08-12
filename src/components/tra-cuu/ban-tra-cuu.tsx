"use client";

/**
 * BÀN TRA CỨU — ba cột: trục văn bản, hỏi đáp, mặt đọc.
 *
 * Tách khỏi trang chủ cũ vì hai chế độ tra cứu giờ ở hai trang khác nhau:
 * hỏi trong kho văn bản thuộc về /documents, còn nghiên cứu sâu có trang
 * riêng. Chế độ do TRANG quyết định, không còn nút gạt trong ô hỏi — người
 * dùng không phải nhớ mình đang đứng ở chế độ nào.
 *
 * KHOẢNH KHẮC CHỮ KÝ giữ nguyên: /api/chat gửi `citations` TRƯỚC rồi mới tới
 * `token`. Nguồn vừa về là trục nạp cây, cuộn tới đúng Điều và đóng dấu đỏ,
 * trong lúc câu trả lời còn chưa có chữ nào.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ChatStatus, Citation, DocumentDetail, StatsResponse } from "@/types/contract";
import type { ResearchProgress, ResearchSource } from "@/types/research";
import { CauTraLoi } from "@/components/cau-tra-loi";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { NguonNghienCuu } from "@/components/nguon-nghien-cuu";
import { MatDoc } from "@/components/mat-doc";
import { OHoi } from "@/components/o-hoi";
import { TrucVanBan } from "@/components/truc-van-ban";
import { DangTai, KhongTimThay, TrangThaiLoi } from "@/components/trang-thai";
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

export interface BanTraCuuProps {
  cheDo: "corpus" | "research";
  /** Nội dung cột giữa khi chưa hỏi gì. Nhận hàm điền sẵn câu hỏi. */
  khiTrong: (chonCauHoi: (cau: string) => void) => ReactNode;
  /** Lời nhắc trong khung trục khi chưa có văn bản nào được trích. */
  moTaTruc?: string;
}

export function BanTraCuu({ cheDo, khiTrong, moTaTruc }: BanTraCuuProps) {
  const [cauHoi, setCauHoi] = useState("");
  const [pha, setPha] = useState<Pha>("rong");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [dangChon, setDangChon] = useState<Citation | null>(null);
  const [topScore, setTopScore] = useState(0);
  const [nguong, setNguong] = useState(0.35);
  const [soVanBan, setSoVanBan] = useState(0);
  const [dangChay, setDangChay] = useState(false);
  const [matDocMo, setMatDocMo] = useState(false);
  const [researchSources, setResearchSources] = useState<ResearchSource[]>([]);
  const [researchProgress, setResearchProgress] = useState<ResearchProgress | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);

  const [vanBan, setVanBan] = useState<DocumentDetail | null>(null);
  const kho = useRef(new Map<string, DocumentDetail>());

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d: StatsResponse) => setSoVanBan(d.tongVanBan))
      .catch(() => undefined);
  }, []);

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
          void moTrichDan(next[0]);
        }
      } else if (event === "research_progress") {
        setResearchProgress(data as unknown as ResearchProgress);
      } else if (event === "research_sources") {
        const next = (data.sources ?? []) as ResearchSource[];
        const local = next.filter((s) => s.kind === "corpus").map(nguonThanhTrichDan);
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

  const soNguon = cheDo === "research" ? researchSources.length : citations.length;
  const coNguon = (pha === "coNguon" || pha === "xong") && soNguon > 0;
  const soDangChon = dangChon
    ? (cheDo === "research"
        ? researchSources.findIndex((s) => s.chunkId === dangChon.chunkId)
        : citations.findIndex((c) => c.chunkId === dangChon.chunkId)) + 1
    : 0;

  const moNguonTheoSo = (so: number) => {
    if (cheDo === "corpus") {
      const c = citations[so - 1];
      if (c) void moTrichDan(c, true);
      return;
    }
    const s = researchSources[so - 1];
    if (!s) return;
    if (s.kind === "corpus") void moTrichDan(nguonThanhTrichDan(s), true);
    else if (s.url) window.open(s.url, "_blank", "noopener,noreferrer");
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
            {moTaTruc ??
              "Khi có câu trả lời, trục dựng cây Chương — Điều của văn bản được trích và cuộn tới đúng chỗ."}
          </p>
        </div>
      )}

      {/* ---------- Cột giữa: hỏi và đáp ---------- */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6">
        <div
          className={cn("mx-auto flex w-full flex-1 flex-col", vanBan ? "max-w-2xl" : "max-w-3xl")}
        >
          <OHoi
            giaTri={cauHoi}
            onDoi={setCauHoi}
            onTraCuu={traCuu}
            dangChay={dangChay}
            cheDo={cheDo}
          />

          <div className="mt-7 flex-1">
            {pha === "rong" ? khiTrong(setCauHoi) : null}
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
            {pha === "loi" ? (
              <TrangThaiLoi onThuLai={traCuu} message={researchError ?? undefined} />
            ) : null}

            {coNguon ? (
              <div className="flex flex-col gap-7">
                {/* Nguồn đứng TRÊN câu trả lời, đúng thứ tự chúng về. */}
                <section>
                  <h2 className="nhan-hoa mb-2.5">Nguồn ({soNguon})</h2>
                  <ul className="flex flex-col gap-1.5">
                    {cheDo === "research"
                      ? researchSources.map((s, i) => (
                          <li key={s.id}>
                            <NguonNghienCuu
                              source={s}
                              index={i + 1}
                              selected={Boolean(s.chunkId && s.chunkId === dangChon?.chunkId)}
                              onSelect={() => {
                                if (s.kind === "corpus")
                                  void moTrichDan(nguonThanhTrichDan(s), true);
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
                      soTrichDan={soNguon}
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

      {/* ---------- Cột phải: mặt đọc ---------- */}
      {matDocMo ? (
        <button
          type="button"
          aria-label="Đóng văn bản gốc"
          onClick={() => setMatDocMo(false)}
          className="fixed inset-0 z-30 bg-muc-in/25 xl:hidden"
        />
      ) : null}

      {vanBan && dangChon ? (
        <div className="hidden xl:block xl:w-[32rem] xl:shrink-0 2xl:w-[38rem]">
          <MatDocCoDau vanBan={vanBan} dangChon={dangChon} />
        </div>
      ) : null}

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-full max-w-xl shadow-noi xl:hidden",
          "transition-transform duration-[--nhip-cham] [transition-timing-function:var(--duong-cong)]",
          matDocMo ? "translate-x-0" : "translate-x-full",
        )}
      >
        {vanBan && dangChon ? (
          <MatDocCoDau vanBan={vanBan} dangChon={dangChon} onDong={() => setMatDocMo(false)} />
        ) : null}
      </div>
    </div>
  );
}

function nguonThanhTrichDan(source: ResearchSource): Citation {
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
