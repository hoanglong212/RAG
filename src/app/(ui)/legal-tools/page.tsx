"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import type { DocumentSummary } from "@/types/contract";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";
import type { CompareChange, CoverageRow, PenaltyResult, TimelineDocument, TimelineRelation } from "@/types/platform";

interface TimelineResponse { at: string; document: TimelineDocument; relations: TimelineRelation[] }
interface CompareResponse { summary: { added: number; removed: number; changed: number }; changes: CompareChange[] }

export default function TrangCongCuPhapLy() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [timelineId, setTimelineId] = useState("");
  const [at, setAt] = useState(new Date().toISOString().slice(0, 10));
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [scenario, setScenario] = useState("");
  const [penalties, setPenalties] = useState<PenaltyResult[]>([]);
  const [penaltyNotice, setPenaltyNotice] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/documents?pageSize=100").then((r) => r.json()),
      fetch("/api/coverage").then((r) => r.json()),
    ]).then(([documentData, coverageData]) => {
      const items = (documentData as { items: DocumentSummary[] }).items;
      setDocs(items); setCoverage(coverageData as CoverageRow[]);
      setTimelineId(items[0]?.id ?? ""); setLeft(items[0]?.id ?? ""); setRight(items[1]?.id ?? "");
    }).catch((error: unknown) => setMessage(readError(error)));
  }, []);

  async function loadTimeline() {
    try { setTimeline(await getJson<TimelineResponse>(`/api/legal/timeline?documentId=${timelineId}&at=${at}`)); }
    catch (error) { setMessage(readError(error)); }
  }

  async function compare() {
    try { setComparison(await getJson<CompareResponse>(`/api/legal/compare?left=${left}&right=${right}`)); }
    catch (error) { setMessage(readError(error)); }
  }

  async function calculate() {
    try {
      const result = await postJson<{ results: PenaltyResult[]; disclaimer: string }>("/api/penalties", { scenario });
      setPenalties(result.results); setPenaltyNotice(result.disclaimer);
    } catch (error) { setMessage(readError(error)); }
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-lg font-semibold">Bộ công cụ pháp lý</h1>
        <p className="mt-1 text-sm text-nhan">Tra cứu theo thời điểm, so sánh phiên bản, đọc mức phạt từ căn cứ và kiểm tra độ phủ corpus.</p>
        {message ? <p className="mt-3 rounded-[--bo] bg-khay-sau px-3 py-2 text-sm text-dau-do">{message}</p> : null}

        <section className="mt-5 rounded-[--bo-lon] bg-giay p-4">
          <h2 className="text-base font-semibold">Hiệu lực tại một thời điểm</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_11rem_auto]">
            <DocumentSelect value={timelineId} onChange={setTimelineId} docs={docs} />
            <input type="date" value={at} onChange={(e) => setAt(e.target.value)} className="rounded-[--bo] bg-khay px-3 py-2 text-sm" />
            <button onClick={() => void loadTimeline()} className="rounded-[--bo] bg-but-xanh px-4 py-2 text-sm font-medium text-giay">Kiểm tra</button>
          </div>
          {timeline ? <div className="mt-4 border-t border-ke-mo pt-4">
            <p className="text-sm font-semibold">{timeline.document.soHieu ?? "Không số hiệu"}: <span className={timeline.document.activeAt ? "text-but-xanh" : "text-dau-do"}>{timeline.document.activeAt ? "Có hiệu lực tại thời điểm đã chọn" : "Không có hiệu lực tại thời điểm đã chọn"}</span></p>
            <p className="mt-1 text-sm text-nhan">{timeline.document.trichYeu}</p>
            {timeline.relations.length ? <div className="mt-3"><h3 className="nhan-hoa">Quan hệ pháp lý</h3><ul className="mt-2 space-y-2">{timeline.relations.map((relation) => <li key={relation.id} className="rounded-[--bo] bg-khay px-3 py-2 text-sm"><span className="font-medium">{relation.type.replaceAll("_", " ")}</span> · {relation.document.soHieu} {relation.effectiveFrom ? `từ ${relation.effectiveFrom}` : ""}<a href={relation.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-but-xanh hover:underline">Nguồn</a></li>)}</ul></div> : <p className="mt-3 text-sm text-nhan">Chưa có quan hệ sửa đổi/thay thế được xác minh trong corpus.</p>}
          </div> : null}
        </section>

        <section className="mt-4 rounded-[--bo-lon] bg-giay p-4">
          <h2 className="text-base font-semibold">So sánh hai văn bản</h2>
          <p className="mt-1 text-xs text-nhan">So sánh các node cùng loại và số thứ tự; kết quả là hỗ trợ rà soát, không thay thế văn bản hợp nhất.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]"><DocumentSelect value={left} onChange={setLeft} docs={docs} /><DocumentSelect value={right} onChange={setRight} docs={docs} /><button onClick={() => void compare()} className="rounded-[--bo] bg-but-xanh px-4 py-2 text-sm font-medium text-giay">So sánh</button></div>
          {comparison ? <div className="mt-4"><div className="flex flex-wrap gap-2 text-sm"><Badge text={`${comparison.summary.changed} thay đổi`} /><Badge text={`${comparison.summary.added} bổ sung`} /><Badge text={`${comparison.summary.removed} loại bỏ`} /></div><div className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto">{comparison.changes.map((change) => <details key={`${change.kind}-${change.key}`} className="rounded-[--bo] bg-khay p-3"><summary className="cursor-pointer text-sm font-medium">{change.kind === "changed" ? "Thay đổi" : change.kind === "added" ? "Bổ sung" : "Loại bỏ"} · {change.breadcrumb}</summary><div className="mt-3 grid gap-3 md:grid-cols-2"><TextBlock title="Văn bản trái" text={change.left} /><TextBlock title="Văn bản phải" text={change.right} /></div></details>)}</div></div> : null}
        </section>

        <section className="mt-4 rounded-[--bo-lon] bg-giay p-4">
          <h2 className="text-base font-semibold">Máy đọc khoảng tiền phạt</h2>
          <textarea rows={4} value={scenario} onChange={(e) => setScenario(e.target.value)} className="mt-3 w-full rounded-[--bo] bg-khay px-3 py-2 text-sm" placeholder="Ví dụ: Người đi xe máy vượt đèn đỏ…" />
          <button disabled={scenario.trim().length < 10} onClick={() => void calculate()} className="mt-2 rounded-[--bo] bg-but-xanh px-4 py-2 text-sm font-medium text-giay disabled:opacity-50">Tìm mức phạt có căn cứ</button>
          {penalties.length ? <div className="mt-4 space-y-3">{penalties.map((penalty) => <div key={penalty.ruleId} className="rounded-[--bo] bg-khay p-3"><p className="text-sm font-semibold">{penalty.label}</p><p className="so-hieu mt-1 text-sm text-nhan">{penalty.amountFrom !== null && penalty.amountTo !== null ? `${money(penalty.amountFrom)} – ${money(penalty.amountTo)}` : "Căn cứ hiện tại không chứa khoảng tiền để máy đọc tự động"}</p>{penalty.evidence ? <div className="mt-2"><ChipTrichDan trichDan={penalty.evidence} soThuTu={1} onChon={() => router.push(`/documents/${penalty.evidence?.documentId}?node=${penalty.evidence?.nodeId}`)} /></div> : null}</div>)}<p className="text-xs text-nhan">{penaltyNotice}</p></div> : scenario && penalties.length === 0 ? <p className="mt-3 text-sm text-nhan">Chưa nhận diện được hành vi trong bộ quy tắc có kiểm chứng.</p> : null}
        </section>

        <section className="mt-4 rounded-[--bo-lon] bg-giay p-4">
          <h2 className="text-base font-semibold">Ma trận phạm vi hỗ trợ</h2>
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-nhan"><tr><th className="px-3 py-2">Chủ đề</th><th className="px-3 py-2 text-right">Văn bản</th><th className="px-3 py-2 text-right">Chunk</th><th className="px-3 py-2 text-right">Đã xác minh</th><th className="px-3 py-2 text-right">Cảnh báo</th><th className="px-3 py-2">Cập nhật</th></tr></thead><tbody>{coverage.map((row) => <tr key={row.topic} className="border-t border-ke-mo"><td className="px-3 py-2 font-medium">{NHAN_CHU_DE_TIN[row.topic]}</td><td className="so-hieu px-3 py-2 text-right">{row.documents}</td><td className="so-hieu px-3 py-2 text-right">{row.chunks}</td><td className="so-hieu px-3 py-2 text-right">{row.verifiedDocuments}</td><td className="so-hieu px-3 py-2 text-right">{row.warningDocuments}</td><td className="px-3 py-2 text-xs text-nhan">{row.lastVerifiedAt ? new Date(row.lastVerifiedAt).toLocaleDateString("vi-VN") : "Chưa có"}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </div>
  );
}

function DocumentSelect({ value, onChange, docs }: { value: string; onChange: (value: string) => void; docs: DocumentSummary[] }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 rounded-[--bo] bg-khay px-3 py-2 text-sm"><option value="">Chọn văn bản</option>{docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.soHieu ?? "Không số hiệu"} — {doc.trichYeu}</option>)}</select>; }
function Badge({ text }: { text: string }) { return <span className="rounded-[--bo] bg-khay px-2 py-1 text-nhan">{text}</span>; }
function TextBlock({ title, text }: { title: string; text: string | null }) { return <div><p className="nhan-hoa">{title}</p><p className="mt-1 max-h-56 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-nhan">{text ?? "—"}</p></div>; }
function money(value: number) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value); }
async function getJson<T>(url: string): Promise<T> { const response = await fetch(url); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Không đọc được dữ liệu."); return data as T; }
async function postJson<T>(url: string, body: unknown): Promise<T> { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Không xử lý được yêu cầu."); return data as T; }
function readError(error: unknown) { return error instanceof Error ? error.message : "Có lỗi xảy ra."; }
