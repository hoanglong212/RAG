"use client";

/**
 * Ba công cụ pháp lý, tách khỏi trang riêng để nằm trong khay icon trên
 * thanh điều hướng.
 *
 * Vì sao bỏ trang /legal-tools: chúng là dụng cụ tra nhanh trong lúc đang
 * làm việc khác, không phải một điểm đến. Bắt người dùng rời màn hình đang
 * đọc để mở một trang riêng rồi quay lại là đúng thứ mà một cái khay dụng cụ
 * sinh ra để tránh.
 *
 * "Ma trận phạm vi hỗ trợ" KHÔNG có ở đây: nó là báo cáo về độ phủ corpus,
 * không phải dụng cụ, nên nó thuộc về trang Đo lường.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, GitCompareArrows, Scale } from "lucide-react";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { Nhan, Nut, TieuDeMuc } from "@/components/kit/co-ban";
import { ONhap, OChon, OVanBan } from "@/components/kit/truong";
import { BaoLoi } from "@/components/kit/trang-thai-kit";
import type { DocumentSummary } from "@/types/contract";
import type {
  CompareChange,
  PenaltyResult,
  TimelineDocument,
  TimelineRelation,
} from "@/types/platform";

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

/** Danh sách văn bản, nạp một lần rồi dùng lại cho cả ba công cụ. */
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

function ChonVanBan({
  value,
  onChange,
  docs,
  nhan,
}: {
  value: string;
  onChange: (v: string) => void;
  docs: DocumentSummary[];
  nhan: string;
}) {
  return (
    <OChon value={value} onChange={(e) => onChange(e.target.value)} aria-label={nhan}>
      <option value="">Chọn văn bản</option>
      {docs.map((d) => (
        <option key={d.id} value={d.id}>
          {d.soHieu ?? "Không có số hiệu"} — {d.trichYeu}
        </option>
      ))}
    </OChon>
  );
}

const tien = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);

async function layJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const d = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(d.error ?? "Không đọc được dữ liệu.");
  return d;
}
async function guiJson<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(d.error ?? "Không xử lý được yêu cầu.");
  return d;
}
const docLoi = (e: unknown) => (e instanceof Error ? e.message : "Có lỗi xảy ra.");

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
      <TieuDeMuc phu="Văn bản này có hiệu lực vào ngày đã chọn hay không">
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
            <span className="so-hieu text-muc-in">
              {kq.document.soHieu ?? "Không có số hiệu"}
            </span>
            <span
              className={
                kq.document.activeAt
                  ? "text-sm font-semibold text-muc-in"
                  : "text-sm font-semibold text-nhan"
              }
            >
              {kq.document.activeAt
                ? "Có hiệu lực tại thời điểm đã chọn"
                : "Không có hiệu lực tại thời điểm đã chọn"}
            </span>
          </div>
          {kq.document.trichYeu ? (
            <p className="mt-1.5 text-sm leading-relaxed text-nhan">{kq.document.trichYeu}</p>
          ) : null}

          {kq.relations.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1.5">
              {kq.relations.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-baseline gap-x-2 rounded-[--bo] bg-khay px-3.5 py-2.5 text-sm"
                >
                  <span className="font-medium">{q.type.replaceAll("_", " ")}</span>
                  <span className="so-hieu text-nhan">{q.document.soHieu}</span>
                  {q.effectiveFrom ? (
                    <span className="text-xs text-nhan">từ {q.effectiveFrom}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-nhan">
              Chưa có quan hệ sửa đổi hay thay thế nào được xác minh trong corpus.
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

  useEffect(() => {
    if (docs.length > 1) {
      setTrai((v) => v || docs[0].id);
      setPhai((v) => v || docs[1].id);
    }
  }, [docs]);

  return (
    <div className="flex flex-col gap-3.5">
      <TieuDeMuc phu="So các node cùng loại và cùng số thứ tự. Hỗ trợ rà soát, không thay thế văn bản hợp nhất.">
        So sánh hai văn bản
      </TieuDeMuc>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <ChonVanBan value={trai} onChange={setTrai} docs={docs} nhan="Văn bản trái" />
        <ChonVanBan value={phai} onChange={setPhai} docs={docs} nhan="Văn bản phải" />
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
                    <p className="nhan-hoa">Văn bản trái</p>
                    <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-nhan">
                      {t.left ?? "—"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="nhan-hoa">Văn bản phải</p>
                    <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-nhan">
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

function CongCuMucPhat() {
  const router = useRouter();
  const [tinhHuong, setTinhHuong] = useState("");
  const [kq, setKq] = useState<PenaltyResult[]>([]);
  const [ghiChu, setGhiChu] = useState("");
  const [daChay, setDaChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3.5">
      <TieuDeMuc phu="Chỉ đọc khoảng tiền có sẵn trong căn cứ, không tự suy ra con số">
        Máy đọc khoảng tiền phạt
      </TieuDeMuc>

      <OVanBan
        rows={3}
        value={tinhHuong}
        onChange={(e) => setTinhHuong(e.target.value)}
        placeholder="Ví dụ: Người đi xe máy vượt đèn đỏ…"
      />
      <div className="flex justify-end">
        <Nut
          disabled={tinhHuong.trim().length < 10}
          onClick={() =>
            void guiJson<{ results: PenaltyResult[]; disclaimer: string }>("/api/penalties", {
              scenario: tinhHuong,
            })
              .then((d) => {
                setKq(d.results);
                setGhiChu(d.disclaimer);
                setDaChay(true);
                setLoi(null);
              })
              .catch((e: unknown) => setLoi(docLoi(e)))
          }
        >
          Tìm mức phạt có căn cứ
        </Nut>
      </div>

      {loi ? <BaoLoi moTa={loi} /> : null}

      {kq.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-ke-mo pt-3.5">
          {kq.map((p) => (
            <div key={p.ruleId} className="rounded-[--bo] bg-khay p-3.5">
              <p className="text-sm font-semibold">{p.label}</p>
              <p className="so-hieu mt-1 text-sm text-nhan">
                {p.amountFrom !== null && p.amountTo !== null
                  ? `${tien(p.amountFrom)} – ${tien(p.amountTo)}`
                  : "Căn cứ không chứa khoảng tiền để máy đọc tự động"}
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
        <p className="border-t border-ke-mo pt-3.5 text-sm text-nhan">
          Chưa nhận diện được hành vi nào trong bộ quy tắc đã kiểm chứng. Thử mô tả sát với
          từ ngữ trong nghị định xử phạt.
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
