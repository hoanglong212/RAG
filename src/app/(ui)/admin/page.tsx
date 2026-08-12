"use client";

import { useEffect, useState } from "react";

interface QualityData {
  summary: { documents: number; warning_documents: number; unverified_documents: number; disabled_documents: number };
  warningDocs: Array<{ id: string; so_hieu: string | null; trich_yeu: string | null; warning_count: number }>;
  staleDocs: Array<{ id: string; so_hieu: string | null; trich_yeu: string | null; verified_at: string | null }>;
  sources: Array<{ id: string; name: string; enabled: boolean; last_fetched_at: string | null; last_error: string | null; article_count: number }>;
  lowQueries: Array<{ cau_hoi: string; diem_cao_nhat: number | null; created_at: string }>;
}

export default function TrangQuanTriChatLuong() {
  const [data, setData] = useState<QualityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void fetch("/api/admin/quality").then(async (r) => { const result = await r.json(); if (!r.ok) throw new Error(result.error); setData(result); }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Không đọc được dữ liệu.")); }, []);
  return <div className="h-full overflow-y-auto px-6 py-5"><div className="mx-auto max-w-6xl"><h1 className="text-lg font-semibold">Quản trị chất lượng</h1><p className="mt-1 text-sm text-nhan">Hàng đợi kiểm tra corpus, nguồn tin và truy vấn yếu.</p>{error ? <p className="mt-3 text-sm text-dau-do">{error}</p> : null}{data ? <>
    <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4"><Metric label="Văn bản" value={data.summary.documents} /><Metric label="Có cảnh báo parse" value={data.summary.warning_documents} /><Metric label="Chưa xác minh" value={data.summary.unverified_documents} /><Metric label="Tắt truy hồi" value={data.summary.disabled_documents} /></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><Panel title="Văn bản cần kiểm tra">{data.warningDocs.map((item) => <a key={item.id} href={`/documents/${item.id}`} className="block rounded-[--bo] bg-khay px-3 py-2 text-sm"><span className="font-medium">{item.so_hieu ?? "Không số hiệu"}</span><span className="ml-2 text-xs text-nhan">{item.warning_count} cảnh báo</span></a>)}</Panel><Panel title="Metadata cũ hoặc chưa xác minh">{data.staleDocs.map((item) => <a key={item.id} href={`/documents/${item.id}`} className="block rounded-[--bo] bg-khay px-3 py-2 text-sm"><span className="font-medium">{item.so_hieu ?? "Không số hiệu"}</span><span className="ml-2 text-xs text-nhan">{item.verified_at ? new Date(item.verified_at).toLocaleDateString("vi-VN") : "Chưa xác minh"}</span></a>)}</Panel><Panel title="Sức khỏe nguồn tin">{data.sources.map((source) => <div key={source.id} className="rounded-[--bo] bg-khay px-3 py-2 text-sm"><span className="font-medium">{source.name}</span><span className="ml-2 text-xs text-nhan">{source.article_count} bài · {source.last_error ? `Lỗi: ${source.last_error}` : "Ổn định"}</span></div>)}</Panel><Panel title="Truy vấn có điểm thấp">{data.lowQueries.map((query, index) => <div key={`${query.created_at}-${index}`} className="rounded-[--bo] bg-khay px-3 py-2 text-sm"><span className="so-hieu mr-2 text-xs text-nhan">{query.diem_cao_nhat?.toFixed(2) ?? "—"}</span>{query.cau_hoi}</div>)}</Panel></div>
  </> : <p className="mt-4 text-sm text-nhan">Đang tải hàng đợi…</p>}</div></div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-[--bo-lon] bg-giay px-4 py-3"><p className="nhan-hoa">{label}</p><p className="so-hieu mt-1 text-xl">{value}</p></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[--bo-lon] bg-giay p-4"><h2 className="nhan-hoa">{title}</h2><div className="mt-2 flex max-h-80 flex-col gap-2 overflow-y-auto">{children}</div></section>; }
