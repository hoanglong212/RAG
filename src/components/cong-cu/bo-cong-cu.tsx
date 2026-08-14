"use client";

/**
 * Ba công cụ pháp lý trong khay icon trên thanh điều hướng.
 *
 * Bản trước đúng về mặt kỹ thuật mà gần như không dùng được, vì cả ba đều bắt
 * người dùng đoán thứ hệ thống biết. Đo trên dữ liệu thật:
 *
 *  - SO SÁNH mặc định ghép văn bản đầu với văn bản thứ hai trong kho, tức là
 *    281/2026/NĐ-CP với 168/2024/NĐ-CP — hai nghị định không liên quan gì. Kết
 *    quả: 1.303 "bổ sung", 0 "thay đổi". Cả kho chỉ có 4 quan hệ văn bản, nên
 *    gần như mọi cặp tự chọn đều sinh ra rác kiểu đó.
 *
 *  - MỨC PHẠT chỉ nhận 12 hành vi viết tay, và người dùng không có đường nào
 *    biết chúng là gì. "Người đi xe máy vượt đèn đỏ" ra kết quả, nhưng "vượt
 *    đèn đỏ" ra rỗng, "công ty trả lương chậm 2 tháng" cũng rỗng.
 *
 *  - Cả ba dùng chung một <select> ghép cứng `số hiệu — trích yếu`, trong khi
 *    41/62 văn bản không có trích yếu.
 *
 * Hướng sửa chung: ĐƯA CÁI HỆ THỐNG BIẾT RA TRƯỚC MẶT thay vì bắt gõ đúng.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, GitCompareArrows, Scale } from "lucide-react";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { ChonVanBan } from "@/components/cong-cu/chon-van-ban";
import { Nhan, Nut, TieuDeMuc } from "@/components/kit/co-ban";
import { ONhap, OVanBan } from "@/components/kit/truong";
import { BaoLoi } from "@/components/kit/trang-thai-kit";
import { docLoi, guiJson, layJson } from "@/components/kit/goi-api";
import { loaiVanBan } from "@/components/tra-cuu/neo-trich-dan";
import type { DocumentSummary } from "@/types/contract";
import type {
  CompareChange,
  PenaltyResult,
  TimelineDocument,
  TimelineRelation,
} from "@/types/platform";
import { cn } from "@/lib/utils";

interface TimelineResponse {
  at: string;
  document: TimelineDocument;
  relations: TimelineRelation[];
}
interface CompareResponse {
  summary: { added: number; removed: number; changed: number };
  changes: CompareChange[];
}

/* ------------------------------------------------------------------ */
/* Dùng chung                                                          */

function useKhoVanBan() {
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  useEffect(() => {
    void fetch("/api/documents?pageSize=100")
      .then((r) => r.json())
      .then((d: { items?: DocumentSummary[] }) => setDocs(d.items ?? []))
      .catch(() => undefined);
  }, []);
  return docs;
}

/** Quan hệ của một văn bản, dùng cho cả công cụ hiệu lực lẫn công cụ so sánh. */
function useQuanHe(documentId: string) {
  const [kq, setKq] = useState<TimelineResponse | null>(null);
  useEffect(() => {
    if (!documentId) {
      setKq(null);
      return;
    }
    let huy = false;
    void layJson<TimelineResponse>(`/api/legal/timeline?documentId=${documentId}`)
      .then((d) => {
        if (!huy) setKq(d);
      })
      .catch(() => undefined);
    return () => {
      huy = true;
    };
  }, [documentId]);
  return kq;
}

/**
 * Tên quan hệ bằng tiếng Việt.
 *
 * Trước đây in thẳng giá trị enum sau khi thay gạch dưới bằng khoảng trắng, ra
 * "sua doi bo sung" — không dấu, không viết hoa, đọc như lỗi dữ liệu.
 */
const NHAN_QUAN_HE: Record<string, { ra: string; vao: string }> = {
  sua_doi_bo_sung: { ra: "Sửa đổi, bổ sung", vao: "Bị sửa đổi bởi" },
  thay_the: { ra: "Thay thế", vao: "Bị thay thế bởi" },
  bai_bo: { ra: "Bãi bỏ", vao: "Bị bãi bỏ bởi" },
  quy_dinh_chi_tiet: { ra: "Quy định chi tiết cho", vao: "Được quy định chi tiết bởi" },
  quy_dinh_xu_phat: { ra: "Quy định xử phạt cho", vao: "Có nghị định xử phạt" },
  huong_dan: { ra: "Hướng dẫn", vao: "Được hướng dẫn bởi" },
};

function nhanQuanHe(q: TimelineRelation): string {
  const m = NHAN_QUAN_HE[q.type];
  if (!m) return q.type.replaceAll("_", " ");
  return q.direction === "outgoing" ? m.ra : m.vao;
}

/** "2024-08-01T00:00:00Z" → "01/08/2024". Chuỗi ISO thô không phải để đọc. */
function ngayVN(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("vi-VN");
}

const tien = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);

function DongQuanHe({ q }: { q: TimelineRelation }) {
  const tu = ngayVN(q.effectiveFrom);
  return (
    <li className="rounded-[--bo] bg-khay px-3.5 py-2.5">
      <p className="text-sm">
        <span className="font-medium">{nhanQuanHe(q)}</span>{" "}
        <span className="so-hieu text-muc-in">{q.document.soHieu ?? "văn bản chưa rõ"}</span>
        {tu ? <span className="text-nhan"> · từ {tu}</span> : null}
      </p>
      {q.document.trichYeu ? (
        <p className="mt-0.5 line-clamp-1 text-[0.8125rem] text-nhan">{q.document.trichYeu}</p>
      ) : null}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Hiệu lực tại một thời điểm                                       */

function CongCuHieuLuc() {
  const docs = useKhoVanBan();
  const [id, setId] = useState("");
  const [moc, setMoc] = useState(new Date().toISOString().slice(0, 10));
  const [kq, setKq] = useState<TimelineResponse | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (!id && docs.length > 0) setId(docs[0].id);
  }, [docs, id]);

  return (
    <div className="flex flex-col gap-3.5">
      <TieuDeMuc phu="Văn bản có hiệu lực vào ngày đã chọn hay không, và văn bản nào đang tác động tới nó">
        Hiệu lực tại một thời điểm
      </TieuDeMuc>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
        <ChonVanBan value={id} onChange={setId} docs={docs} nhan="Văn bản cần tra" />
        <ONhap type="date" value={moc} onChange={(e) => setMoc(e.target.value)} />
        <Nut
          disabled={!id}
          onClick={() =>
            void layJson<TimelineResponse>(`/api/legal/timeline?documentId=${id}&at=${moc}`)
              .then((d) => {
                setKq(d);
                setLoi(null);
              })
              .catch((e: unknown) => setLoi(docLoi(e)))
          }
        >
          Kiểm tra
        </Nut>
      </div>

      {loi ? <BaoLoi moTa={loi} /> : null}

      {kq ? (
        <div className="border-t border-ke-mo pt-3.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="so-hieu font-semibold text-muc-in">
              {kq.document.soHieu ?? "Không có số hiệu"}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                kq.document.activeAt ? "text-muc-in" : "text-nhan",
              )}
            >
              {kq.document.activeAt ? "Có hiệu lực" : "Không có hiệu lực"} vào{" "}
              {ngayVN(moc) ?? moc}
            </span>
          </div>
          {/* Ngày hiệu lực là căn cứ của câu trả lời phía trên, nên phải hiện
              ra — không thì đó chỉ là một chữ "có/không" không kiểm chứng được. */}
          {ngayVN(kq.document.ngayHieuLuc) ? (
            <p className="mt-1 text-[0.8125rem] text-nhan">
              Hiệu lực thi hành từ {ngayVN(kq.document.ngayHieuLuc)}.
            </p>
          ) : (
            <p className="mt-1 text-[0.8125rem] text-nhan">
              Kho chưa ghi nhận ngày hiệu lực của văn bản này.
            </p>
          )}
          {kq.document.trichYeu ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muc-mo">{kq.document.trichYeu}</p>
          ) : null}

          {kq.relations.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1.5">
              {kq.relations.map((q) => (
                <DongQuanHe key={q.id} q={q} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muc-mo">
              Chưa có quan hệ sửa đổi hay thay thế nào được xác minh trong kho.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. So sánh hai văn bản                                              */

function CongCuSoSanh() {
  const docs = useKhoVanBan();
  const [trai, setTrai] = useState("");
  const [phai, setPhai] = useState("");
  const [kq, setKq] = useState<CompareResponse | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const quanHe = useQuanHe(trai);

  useEffect(() => {
    if (!trai && docs.length > 0) setTrai(docs[0].id);
  }, [docs, trai]);

  /*
   * Bên phải CHỈ liệt kê văn bản có quan hệ với bên trái.
   *
   * So hai văn bản không liên quan không sinh ra thông tin: hai cây Điều khác
   * nhau hoàn toàn thì mọi node đều là "bổ sung". Đúng như bản cũ, nơi cặp mặc
   * định cho ra 1.303 bổ sung và 0 thay đổi — một con số lớn không nói gì cả.
   */
  const chonDuocBenPhai = useMemo(
    () => new Set((quanHe?.relations ?? []).map((q) => q.document.id)),
    [quanHe],
  );

  useEffect(() => {
    setKq(null);
    setPhai((v) => (v && chonDuocBenPhai.has(v) ? v : ""));
  }, [chonDuocBenPhai]);

  const soHieuTrai = docs.find((d) => d.id === trai)?.soHieu ?? "văn bản đã chọn";

  return (
    <div className="flex flex-col gap-3.5">
      <TieuDeMuc phu="So từng Điều giữa một văn bản và văn bản có quan hệ với nó. Hỗ trợ rà soát, không thay thế văn bản hợp nhất.">
        So sánh hai văn bản
      </TieuDeMuc>

      <div className="grid gap-2 sm:grid-cols-2">
        <ChonVanBan value={trai} onChange={setTrai} docs={docs} nhan="Văn bản gốc" />
        <ChonVanBan
          value={phai}
          onChange={setPhai}
          docs={docs}
          nhan="Văn bản đối chiếu"
          gioiHan={chonDuocBenPhai}
          khiTrong={`Kho chưa ghi nhận văn bản nào sửa đổi, thay thế hay quy định chi tiết cho ${soHieuTrai}, nên chưa có gì để đối chiếu.`}
        />
      </div>

      {chonDuocBenPhai.size > 0 ? (
        <div className="flex justify-end">
          <Nut
            disabled={!trai || !phai}
            onClick={() =>
              void layJson<CompareResponse>(`/api/legal/compare?left=${trai}&right=${phai}`)
                .then((d) => {
                  setKq(d);
                  setLoi(null);
                })
                .catch((e: unknown) => setLoi(docLoi(e)))
            }
          >
            So sánh
          </Nut>
        </div>
      ) : null}

      {loi ? <BaoLoi moTa={loi} /> : null}

      {kq ? (
        <div className="border-t border-ke-mo pt-3.5">
          <div className="flex flex-wrap gap-1.5">
            <Nhan dam>{kq.summary.changed} thay đổi</Nhan>
            <Nhan>{kq.summary.added} bổ sung</Nhan>
            <Nhan>{kq.summary.removed} loại bỏ</Nhan>
          </div>
          <div className="mt-3 flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {kq.changes.map((t) => (
              <details
                key={`${t.kind}-${t.key}`}
                className="group rounded-[--bo] bg-khay px-3.5 py-2.5"
              >
                <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                  <span className="text-nhan group-open:text-muc-in">
                    {t.kind === "changed"
                      ? "Thay đổi"
                      : t.kind === "added"
                        ? "Bổ sung"
                        : "Loại bỏ"}
                  </span>
                  <span className="ml-2">{t.breadcrumb}</span>
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="nhan-hoa">Văn bản gốc</p>
                    <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muc-mo">
                      {t.left ?? "—"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="nhan-hoa">Văn bản đối chiếu</p>
                    <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muc-mo">
                      {t.right ?? "—"}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Máy đọc khoảng tiền phạt                                         */

/**
 * Bộ hành vi máy đọc thật sự nhận ra, lấy thẳng từ kết quả API.
 *
 * Đây là thay đổi quan trọng nhất của công cụ này. Nó chỉ biết 12 hành vi viết
 * tay, khớp bằng biểu thức chính quy trên đúng từ ngữ của nghị định — nên
 * "Người đi xe máy vượt đèn đỏ" ra kết quả còn "vượt đèn đỏ" thì không. Bắt
 * người dùng đoán đúng câu chữ là bắt họ chơi trò đoán chữ với một cái hộp
 * trống, và im lặng khi trượt khiến công cụ trông như hỏng.
 *
 * Bày sẵn danh mục thì câu hỏi đổi từ "phải gõ thế nào" thành "hệ thống biết
 * gì" — và câu sau trả lời được ngay bằng một cái liếc mắt.
 */
const VI_DU_HANH_VI = [
  "Người điều khiển xe mô tô, xe gắn máy không chấp hành đèn tín hiệu giao thông",
  "Người điều khiển xe mô tô, xe gắn máy không đội mũ bảo hiểm đúng quy cách",
  "Trả lương không đúng hạn, không trả hoặc trả không đủ tiền lương",
  "Bán thực phẩm đã quá hạn sử dụng",
  "Thực phẩm bao gói sẵn không ghi nhãn theo quy định",
  "Lấn đất hoặc chiếm đất",
  "Không thực hiện đầy đủ trách nhiệm bảo hành sản phẩm, hàng hóa",
] as const;

function CongCuMucPhat() {
  const router = useRouter();
  const [tinhHuong, setTinhHuong] = useState("");
  const [kq, setKq] = useState<PenaltyResult[]>([]);
  const [ghiChu, setGhiChu] = useState("");
  const [daChay, setDaChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const chay = useCallback(
    (noiDung: string) =>
      void guiJson<{ results: PenaltyResult[]; disclaimer: string }>("/api/penalties", {
        scenario: noiDung,
      })
        .then((d) => {
          setKq(d.results);
          setGhiChu(d.disclaimer);
          setDaChay(true);
          setLoi(null);
        })
        .catch((e: unknown) => setLoi(docLoi(e))),
    [],
  );

  return (
    <div className="flex flex-col gap-3.5">
      <TieuDeMuc phu="Chỉ đọc khoảng tiền có sẵn trong căn cứ, không tự suy ra con số">
        Máy đọc khoảng tiền phạt
      </TieuDeMuc>

      <OVanBan
        rows={2}
        value={tinhHuong}
        onChange={(e) => setTinhHuong(e.target.value)}
        placeholder="Mô tả hành vi, hoặc chọn một mẫu bên dưới"
      />

      {/* Danh mục hành vi máy đọc nhận ra. Bấm là chạy luôn. */}
      <div>
        <p className="nhan-hoa mb-1.5">Hành vi máy đọc nhận ra</p>
        <div className="flex flex-wrap gap-1.5">
          {VI_DU_HANH_VI.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setTinhHuong(v);
                chay(v);
              }}
              className={cn(
                "max-w-full truncate rounded-full bg-khay px-3 py-1.5 text-xs text-muc-mo",
                "transition-colors duration-[--nhip] hover:bg-khay-sau hover:text-muc-in",
              )}
              title={v}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Nut disabled={tinhHuong.trim().length < 10} onClick={() => chay(tinhHuong)}>
          Tìm mức phạt có căn cứ
        </Nut>
      </div>

      {loi ? <BaoLoi moTa={loi} /> : null}

      {kq.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-ke-mo pt-3.5">
          {kq.map((p) => (
            <div key={p.ruleId} className="rounded-[--bo] bg-khay p-3.5">
              <p className="text-sm font-semibold">{p.label}</p>
              <p className="mt-1 text-sm">
                {p.amountFrom !== null && p.amountTo !== null ? (
                  <span className="so-hieu font-semibold text-muc-in">
                    {tien(p.amountFrom)} – {tien(p.amountTo)}
                  </span>
                ) : (
                  <span className="text-muc-mo">
                    Căn cứ không chứa khoảng tiền để máy đọc tự động
                  </span>
                )}
              </p>
              {/* Điều khoản là thứ làm con số trên kiểm chứng được. */}
              <p className="so-hieu mt-1 text-xs text-nhan">
                {loaiVanBan(p.source.soHieu)} {p.source.soHieu} · Điều {p.source.dieu}
                {p.source.khoan ? ` · Khoản ${p.source.khoan}` : ""}
                {p.source.diem ? ` · Điểm ${p.source.diem}` : ""}
              </p>
              {p.evidence ? (
                <div className="mt-2.5">
                  <ChipTrichDan
                    trichDan={p.evidence}
                    soThuTu={1}
                    onChon={(c) => router.push(`/documents/${c.documentId}?node=${c.nodeId}`)}
                  />
                </div>
              ) : null}
            </div>
          ))}
          <p className="text-xs leading-relaxed text-nhan">{ghiChu}</p>
        </div>
      ) : daChay ? (
        <p className="border-t border-ke-mo pt-3.5 text-sm leading-relaxed text-muc-mo">
          Không nhận ra hành vi nào trong bộ quy tắc đã kiểm chứng. Máy đọc chỉ khớp đúng
          những hành vi liệt kê ở trên — chọn một mẫu để xem nó hoạt động thế nào.
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export const BO_CONG_CU = [
  {
    ma: "hieu-luc",
    nhan: "Hiệu lực",
    moTa: "Văn bản còn hiệu lực vào ngày nào",
    icon: CalendarClock,
    Noi: CongCuHieuLuc,
  },
  {
    ma: "so-sanh",
    nhan: "So sánh",
    moTa: "Đối chiếu hai văn bản theo từng Điều",
    icon: GitCompareArrows,
    Noi: CongCuSoSanh,
  },
  {
    ma: "muc-phat",
    nhan: "Mức phạt",
    moTa: "Đọc khoảng tiền phạt từ căn cứ",
    icon: Scale,
    Noi: CongCuMucPhat,
  },
] as const;

export type MaCongCu = (typeof BO_CONG_CU)[number]["ma"];
