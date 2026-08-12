"use client";

/**
 * Bộ công cụ pháp lý — bốn dụng cụ độc lập, mỗi cái một thẻ.
 *
 * Kết quả luôn mở ra ngay dưới dụng cụ sinh ra nó, không dồn xuống cuối trang,
 * để người dùng không phải nhớ mình vừa bấm cái nào.
 *
 * Trạng thái hiệu lực KHÔNG tô đỏ khi hết hiệu lực — đỏ là dấu chứng thực của
 * trích dẫn. Ở đây phân biệt bằng chữ và sức nặng.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { KhungTrang, Nhan, Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { ONhap, OChon, OVanBan } from "@/components/kit/truong";
import { BaoLoi } from "@/components/kit/trang-thai-kit";
import type { DocumentSummary } from "@/types/contract";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";
import type {
  CompareChange,
  CoverageRow,
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

export default function TrangCongCuPhapLy() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [phuSong, setPhuSong] = useState<CoverageRow[]>([]);
  const [idThoiDiem, setIdThoiDiem] = useState("");
  const [moc, setMoc] = useState(new Date().toISOString().slice(0, 10));
  const [thoiDiem, setThoiDiem] = useState<TimelineResponse | null>(null);
  const [trai, setTrai] = useState("");
  const [phai, setPhai] = useState("");
  const [soSanh, setSoSanh] = useState<CompareResponse | null>(null);
  const [tinhHuong, setTinhHuong] = useState("");
  const [mucPhat, setMucPhat] = useState<PenaltyResult[]>([]);
  const [daTinh, setDaTinh] = useState(false);
  const [ghiChuPhat, setGhiChuPhat] = useState("");
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/documents?pageSize=100").then((r) => r.json()),
      fetch("/api/coverage").then((r) => r.json()),
    ])
      .then(([d, c]) => {
        const items = (d as { items: DocumentSummary[] }).items;
        setDocs(items);
        setPhuSong(c as CoverageRow[]);
        setIdThoiDiem(items[0]?.id ?? "");
        setTrai(items[0]?.id ?? "");
        setPhai(items[1]?.id ?? "");
      })
      .catch((e: unknown) => setLoi(docLoi(e)));
  }, []);

  return (
    <KhungTrang
      tieuDe="Bộ công cụ pháp lý"
      moTa="Tra hiệu lực tại một thời điểm, so sánh hai phiên bản, đọc khoảng tiền phạt từ căn cứ, và xem corpus đang phủ tới đâu."
      rong="rong"
    >
      <div className="flex flex-col gap-3">
        {loi ? <BaoLoi moTa={loi} /> : null}

        {/* ---------- Hiệu lực tại một thời điểm ---------- */}
        <The className="flex flex-col gap-4">
          <TieuDeMuc phu="Văn bản này có hiệu lực vào ngày đã chọn hay không">
            Hiệu lực tại một thời điểm
          </TieuDeMuc>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_11rem_auto]">
            <ChonVanBan value={idThoiDiem} onChange={setIdThoiDiem} docs={docs} />
            <ONhap type="date" value={moc} onChange={(e) => setMoc(e.target.value)} />
            <Nut
              onClick={() =>
                void layJson<TimelineResponse>(
                  `/api/legal/timeline?documentId=${idThoiDiem}&at=${moc}`,
                )
                  .then(setThoiDiem)
                  .catch((e: unknown) => setLoi(docLoi(e)))
              }
            >
              Kiểm tra
            </Nut>
          </div>

          {thoiDiem ? (
            <div className="border-t border-ke-mo pt-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="so-hieu text-muc-in">
                  {thoiDiem.document.soHieu ?? "Không có số hiệu"}
                </span>
                <span
                  className={
                    thoiDiem.document.activeAt
                      ? "text-sm font-semibold text-muc-in"
                      : "text-sm font-semibold text-nhan"
                  }
                >
                  {thoiDiem.document.activeAt
                    ? "Có hiệu lực tại thời điểm đã chọn"
                    : "Không có hiệu lực tại thời điểm đã chọn"}
                </span>
              </div>
              {thoiDiem.document.trichYeu ? (
                <p className="mt-1.5 text-sm leading-relaxed text-nhan">
                  {thoiDiem.document.trichYeu}
                </p>
              ) : null}

              {thoiDiem.relations.length > 0 ? (
                <div className="mt-4">
                  <p className="nhan-hoa">Quan hệ pháp lý</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {thoiDiem.relations.map((q) => (
                      <li
                        key={q.id}
                        className="flex flex-wrap items-baseline gap-x-2 rounded-[--bo] bg-khay px-3.5 py-2.5 text-sm"
                      >
                        <span className="font-medium">{q.type.replaceAll("_", " ")}</span>
                        <span className="so-hieu text-nhan">{q.document.soHieu}</span>
                        {q.effectiveFrom ? (
                          <span className="text-xs text-nhan">từ {q.effectiveFrom}</span>
                        ) : null}
                        <a
                          href={q.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto text-xs text-but-xanh underline-offset-4 hover:underline"
                        >
                          Nguồn
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-sm text-nhan">
                  Chưa có quan hệ sửa đổi hay thay thế nào được xác minh trong corpus.
                </p>
              )}
            </div>
          ) : null}
        </The>

        {/* ---------- So sánh hai văn bản ---------- */}
        <The className="flex flex-col gap-4">
          <TieuDeMuc phu="So các node cùng loại và cùng số thứ tự. Đây là hỗ trợ rà soát, không thay thế văn bản hợp nhất.">
            So sánh hai văn bản
          </TieuDeMuc>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <ChonVanBan value={trai} onChange={setTrai} docs={docs} />
            <ChonVanBan value={phai} onChange={setPhai} docs={docs} />
            <Nut
              onClick={() =>
                void layJson<CompareResponse>(`/api/legal/compare?left=${trai}&right=${phai}`)
                  .then(setSoSanh)
                  .catch((e: unknown) => setLoi(docLoi(e)))
              }
            >
              So sánh
            </Nut>
          </div>

          {soSanh ? (
            <div className="border-t border-ke-mo pt-4">
              <div className="flex flex-wrap gap-1.5">
                <Nhan dam>{soSanh.summary.changed} thay đổi</Nhan>
                <Nhan>{soSanh.summary.added} bổ sung</Nhan>
                <Nhan>{soSanh.summary.removed} loại bỏ</Nhan>
              </div>
              <div className="mt-3 flex max-h-[32rem] flex-col gap-1.5 overflow-y-auto">
                {soSanh.changes.map((t) => (
                  <details
                    key={`${t.kind}-${t.key}`}
                    className="group rounded-[--bo] bg-khay px-3.5 py-2.5"
                  >
                    <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                      <span className="text-nhan group-open:text-muc-in">
                        {t.kind === "changed" ? "Thay đổi" : t.kind === "added" ? "Bổ sung" : "Loại bỏ"}
                      </span>
                      <span className="ml-2">{t.breadcrumb}</span>
                    </summary>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <KhoiChu tieuDe="Văn bản trái" chu={t.left} />
                      <KhoiChu tieuDe="Văn bản phải" chu={t.right} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </The>

        {/* ---------- Khoảng tiền phạt ---------- */}
        <The className="flex flex-col gap-4">
          <TieuDeMuc phu="Chỉ đọc khoảng tiền có sẵn trong căn cứ, không tự suy ra con số">
            Máy đọc khoảng tiền phạt
          </TieuDeMuc>
          <OVanBan
            rows={4}
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
                  .then((kq) => {
                    setMucPhat(kq.results);
                    setGhiChuPhat(kq.disclaimer);
                    setDaTinh(true);
                  })
                  .catch((e: unknown) => setLoi(docLoi(e)))
              }
            >
              Tìm mức phạt có căn cứ
            </Nut>
          </div>

          {mucPhat.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-ke-mo pt-4">
              {mucPhat.map((p) => (
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
              <p className="text-xs leading-relaxed text-nhan">{ghiChuPhat}</p>
            </div>
          ) : daTinh ? (
            <p className="border-t border-ke-mo pt-4 text-sm text-nhan">
              Chưa nhận diện được hành vi nào trong bộ quy tắc đã kiểm chứng. Thử mô tả sát
              với từ ngữ trong nghị định xử phạt.
            </p>
          ) : null}
        </The>

        {/* ---------- Ma trận phạm vi ---------- */}
        <The khongDem>
          <div className="p-4 sm:p-5">
            <TieuDeMuc phu="Corpus đang phủ tới đâu ở từng chủ đề">
              Ma trận phạm vi hỗ trợ
            </TieuDeMuc>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead>
                <tr className="border-y border-ke-mo">
                  <th className="nhan-hoa px-4 py-2.5 font-semibold sm:px-5">Chủ đề</th>
                  <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Văn bản</th>
                  <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Chunk</th>
                  <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Đã xác minh</th>
                  <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Cảnh báo</th>
                  <th className="nhan-hoa px-4 py-2.5 font-semibold sm:px-5">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {phuSong.map((h) => (
                  <tr key={h.topic} className="border-b border-ke-mo last:border-0">
                    <td className="px-4 py-2.5 font-medium sm:px-5">
                      {NHAN_CHU_DE_TIN[h.topic]}
                    </td>
                    <td className="so-hieu px-4 py-2.5 text-right tabular-nums">{h.documents}</td>
                    <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan">
                      {h.chunks}
                    </td>
                    <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan">
                      {h.verifiedDocuments}
                    </td>
                    <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan">
                      {h.warningDocuments}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-nhan sm:px-5">
                      {h.lastVerifiedAt
                        ? new Date(h.lastVerifiedAt).toLocaleDateString("vi-VN")
                        : "Chưa có"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </The>
      </div>
    </KhungTrang>
  );
}

function ChonVanBan({
  value,
  onChange,
  docs,
}: {
  value: string;
  onChange: (v: string) => void;
  docs: DocumentSummary[];
}) {
  return (
    <OChon value={value} onChange={(e) => onChange(e.target.value)} aria-label="Chọn văn bản">
      <option value="">Chọn văn bản</option>
      {docs.map((d) => (
        <option key={d.id} value={d.id}>
          {d.soHieu ?? "Không có số hiệu"} — {d.trichYeu}
        </option>
      ))}
    </OChon>
  );
}

function KhoiChu({ tieuDe, chu }: { tieuDe: string; chu: string | null }) {
  return (
    <div className="min-w-0">
      <p className="nhan-hoa">{tieuDe}</p>
      <p className="mt-1.5 max-h-56 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-nhan">
        {chu ?? "—"}
      </p>
    </div>
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
