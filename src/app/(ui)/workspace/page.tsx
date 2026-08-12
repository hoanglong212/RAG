"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import type { NewsTopic } from "@/types/news";
import { NHAN_CHU_DE_TIN, NHAN_KET_QUA_PHAP_LY } from "@/types/nhan-news";
import type { CaseAnalysis, LegalCaseView, UserProfileView, WatchlistView } from "@/types/platform";

const TOPICS: NewsTopic[] = ["an_toan_thuc_pham", "lao_dong", "giao_thong", "dat_dai_nha_o", "nguoi_tieu_dung"];

export default function TrangKhongGianLamViec() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileView | null>(null);
  const [cases, setCases] = useState<LegalCaseView[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistView[]>([]);
  const [scenario, setScenario] = useState("");
  const [topic, setTopic] = useState<NewsTopic | "">("");
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [watchName, setWatchName] = useState("");
  const [watchTopic, setWatchTopic] = useState<NewsTopic>("giao_thong");
  const [templateId, setTemplateId] = useState("complaint");
  const [templateFields, setTemplateFields] = useState({ fullName: "", address: "", recipient: "", facts: "", request: "" });
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [p, c, w] = await Promise.all([fetchJson<UserProfileView>("/api/profile"), fetchJson<LegalCaseView[]>("/api/cases"), fetchJson<WatchlistView[]>("/api/watchlists")]);
    setProfile(p); setCases(c); setWatchlists(w);
  }, []);

  useEffect(() => { void refresh().catch((error: unknown) => setMessage(readError(error))); }, [refresh]);

  async function analyze() {
    setLoading(true); setMessage(null);
    try {
      const result = await postJson<CaseAnalysis>("/api/cases/analyze", { scenario, ...(topic ? { topic } : {}) });
      setAnalysis(result);
    } catch (error) { setMessage(readError(error)); }
    finally { setLoading(false); }
  }

  async function saveCase() {
    if (!analysis) return;
    await postJson("/api/cases", { title: scenario.slice(0, 90), scenario, topic: topic || null, analysis });
    setMessage("Đã lưu hồ sơ vào không gian làm việc.");
    await refresh();
  }

  async function saveProfile() {
    if (!profile) return;
    const response = await fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) });
    if (!response.ok) throw new Error("Không lưu được hồ sơ.");
    setMessage("Đã cập nhật hồ sơ người dùng.");
  }

  async function addWatchlist() {
    await postJson("/api/watchlists", { name: watchName || NHAN_CHU_DE_TIN[watchTopic], topics: [watchTopic], documentIds: [] });
    setWatchName(""); setMessage("Đã tạo theo dõi mới."); await refresh();
  }

  async function generateTemplate() {
    const payload = { ...templateFields, seller: templateFields.recipient, employer: templateFields.recipient, product: templateFields.facts, period: templateFields.facts };
    const result = await postJson<{ text: string }>("/api/templates", { templateId, fields: payload });
    setDraft(result.text);
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5 print:h-auto print:overflow-visible">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-lg font-semibold">Không gian hồ sơ</h1>
        <p className="mt-1 text-sm text-nhan">Hồ sơ được gắn với trình duyệt hiện tại bằng cookie riêng tư.</p>

        <section className="mt-5 rounded-[--bo-lon] bg-giay p-4 print:hidden">
          <h2 className="nhan-hoa">Hồ sơ người dùng</h2>
          {profile ? <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} className="rounded-[--bo] bg-khay px-3 py-2 text-sm" placeholder="Tên hiển thị" />
            <input value={profile.email ?? ""} onChange={(e) => setProfile({ ...profile, email: e.target.value || null })} className="rounded-[--bo] bg-khay px-3 py-2 text-sm" placeholder="Email (không bắt buộc)" />
            <button onClick={() => void saveProfile().catch((e: unknown) => setMessage(readError(e)))} className="rounded-[--bo] bg-khay-sau px-3 py-2 text-sm font-medium">Lưu hồ sơ</button>
          </div> : <p className="mt-2 text-sm text-nhan">Đang tạo hồ sơ…</p>}
        </section>

        <section className="mt-4 rounded-[--bo-lon] bg-giay p-4">
          <h2 className="text-base font-semibold">Hồ sơ tình huống thông minh</h2>
          <textarea rows={6} value={scenario} onChange={(e) => setScenario(e.target.value)} className="mt-3 w-full rounded-[--bo] bg-khay px-3 py-2 text-sm leading-relaxed" placeholder="Mô tả đầy đủ sự việc…" />
          <div className="mt-2 flex flex-wrap gap-2 print:hidden">
            <select value={topic} onChange={(e) => setTopic(e.target.value as NewsTopic | "")} className="rounded-[--bo] bg-khay px-3 py-2 text-sm"><option value="">Tự nhận diện chủ đề</option>{TOPICS.map((item) => <option key={item} value={item}>{NHAN_CHU_DE_TIN[item]}</option>)}</select>
            <button disabled={loading || scenario.trim().length < 10} onClick={() => void analyze()} className="rounded-[--bo] bg-but-xanh px-4 py-2 text-sm font-medium text-giay disabled:opacity-50">{loading ? "Đang phân tích…" : "Phân tích hồ sơ"}</button>
          </div>
          {analysis ? <div className="mt-5 border-t border-ke-mo pt-4">
            <h3 className="font-semibold">{NHAN_KET_QUA_PHAP_LY[analysis.status]}</h3>
            {analysis.answer ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{analysis.answer}</p> : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <List title="Dữ kiện cần bổ sung" items={analysis.missingFacts} />
              <List title="Bước nên làm tiếp" items={analysis.nextSteps} />
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">{analysis.citations.map((citation, index) => <ChipTrichDan key={citation.chunkId} trichDan={citation} soThuTu={index + 1} onChon={() => router.push(`/documents/${citation.documentId}?node=${citation.nodeId}`)} />)}</div>
            <p className="mt-4 text-xs text-nhan">{analysis.disclaimer}</p>
            <div className="mt-3 flex gap-2 print:hidden"><button onClick={() => void saveCase().catch((e: unknown) => setMessage(readError(e)))} className="rounded-[--bo] bg-khay-sau px-3 py-2 text-sm">Lưu hồ sơ</button><button onClick={() => window.print()} className="rounded-[--bo] bg-khay-sau px-3 py-2 text-sm">In / xuất PDF</button></div>
          </div> : null}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2 print:hidden">
          <section className="rounded-[--bo-lon] bg-giay p-4">
            <h2 className="text-base font-semibold">Theo dõi thay đổi</h2>
            <div className="mt-3 flex gap-2"><input value={watchName} onChange={(e) => setWatchName(e.target.value)} className="min-w-0 flex-1 rounded-[--bo] bg-khay px-3 py-2 text-sm" placeholder="Tên theo dõi" /><select value={watchTopic} onChange={(e) => setWatchTopic(e.target.value as NewsTopic)} className="rounded-[--bo] bg-khay px-2 text-sm">{TOPICS.map((item) => <option key={item} value={item}>{NHAN_CHU_DE_TIN[item]}</option>)}</select><button onClick={() => void addWatchlist().catch((e: unknown) => setMessage(readError(e)))} className="rounded-[--bo] bg-but-xanh px-3 text-sm text-giay">Thêm</button></div>
            <div className="mt-3 flex flex-col gap-2">{watchlists.map((watch) => <div key={watch.id} className="rounded-[--bo] bg-khay p-3"><p className="text-sm font-medium">{watch.name} · {watch.alerts.length} cập nhật</p>{watch.alerts.slice(0, 3).map((alert) => <a key={`${alert.kind}-${alert.id}`} href={alert.href} className="mt-1 block line-clamp-1 text-xs text-nhan hover:text-but-xanh">{alert.kind === "news" ? "Tin" : "Văn bản"}: {alert.title}</a>)}</div>)}</div>
          </section>

          <section className="rounded-[--bo-lon] bg-giay p-4">
            <h2 className="text-base font-semibold">Tạo đơn và biểu mẫu</h2>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="mt-3 w-full rounded-[--bo] bg-khay px-3 py-2 text-sm"><option value="complaint">Đơn khiếu nại</option><option value="warranty">Yêu cầu bảo hành</option><option value="salary">Yêu cầu thanh toán lương</option></select>
            <div className="mt-2 grid gap-2 md:grid-cols-2"><input value={templateFields.fullName} onChange={(e) => setTemplateFields({ ...templateFields, fullName: e.target.value })} placeholder="Họ tên" className="rounded-[--bo] bg-khay px-3 py-2 text-sm" /><input value={templateFields.recipient} onChange={(e) => setTemplateFields({ ...templateFields, recipient: e.target.value })} placeholder="Nơi nhận / bên liên quan" className="rounded-[--bo] bg-khay px-3 py-2 text-sm" /><input value={templateFields.address} onChange={(e) => setTemplateFields({ ...templateFields, address: e.target.value })} placeholder="Địa chỉ" className="rounded-[--bo] bg-khay px-3 py-2 text-sm md:col-span-2" /><textarea value={templateFields.facts} onChange={(e) => setTemplateFields({ ...templateFields, facts: e.target.value })} placeholder="Sự việc / sản phẩm / kỳ lương" className="rounded-[--bo] bg-khay px-3 py-2 text-sm md:col-span-2" /><textarea value={templateFields.request} onChange={(e) => setTemplateFields({ ...templateFields, request: e.target.value })} placeholder="Yêu cầu" className="rounded-[--bo] bg-khay px-3 py-2 text-sm md:col-span-2" /></div>
            <button onClick={() => void generateTemplate().catch((e: unknown) => setMessage(readError(e)))} className="mt-2 rounded-[--bo] bg-khay-sau px-3 py-2 text-sm">Tạo bản nháp</button>
            {draft ? <textarea readOnly rows={12} value={draft} className="mt-3 w-full rounded-[--bo] bg-khay px-3 py-2 font-mono text-xs" /> : null}
          </section>
        </div>

        <section className="mt-4 rounded-[--bo-lon] bg-giay p-4 print:hidden"><h2 className="text-base font-semibold">Hồ sơ đã lưu ({cases.length})</h2><div className="mt-2 grid gap-2 md:grid-cols-2">{cases.map((item) => <button key={item.id} onClick={() => { setScenario(item.scenario); setTopic(item.topic ?? ""); setAnalysis(item.analysis); }} className="rounded-[--bo] bg-khay p-3 text-left"><span className="block line-clamp-1 text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs text-nhan">{new Date(item.updatedAt).toLocaleString("vi-VN")}</span></button>)}</div></section>
        {message ? <p className="mt-4 rounded-[--bo] bg-khay-sau px-3 py-2 text-sm text-nhan print:hidden">{message}</p> : null}
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) { return <div><h4 className="nhan-hoa">{title}</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-nhan">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
async function fetchJson<T>(url: string): Promise<T> { const response = await fetch(url); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Không đọc được dữ liệu."); return data as T; }
async function postJson<T = unknown>(url: string, body: unknown): Promise<T> { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Không xử lý được yêu cầu."); return data as T; }
function readError(error: unknown): string { return error instanceof Error ? error.message : "Có lỗi xảy ra."; }
