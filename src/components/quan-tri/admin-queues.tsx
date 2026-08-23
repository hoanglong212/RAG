"use client";

import Link from "next/link";
import { The, TieuDeMuc } from "@/components/kit/co-ban";

interface DuLieuChatLuong {
  warningDocs: Array<{
    id: string;
    so_hieu: string | null;
    trich_yeu: string | null;
    warning_count: number;
  }>;
  staleDocs: Array<{
    id: string;
    so_hieu: string | null;
    trich_yeu: string | null;
    verified_at: string | null;
  }>;
  sources: Array<{
    id: string;
    name: string;
    enabled: boolean;
    last_fetched_at: string | null;
    last_error: string | null;
    article_count: number;
  }>;
  lowQueries: Array<{ cau_hoi: string; diem_cao_nhat: number | null; created_at: string }>;
}

function Khung({
  tieuDe,
  phu,
  rong,
  children,
}: {
  tieuDe: string;
  phu?: string;
  rong?: string;
  children: React.ReactNode;
}) {
  return (
    <The className="flex min-h-0 flex-col sang-khi-cham">
      <TieuDeMuc phu={phu}>{tieuDe}</TieuDeMuc>
      <div className="mt-3 flex max-h-80 flex-col gap-1.5 overflow-y-auto">
        {children ?? null}
      </div>
      {rong ? <p className="mt-3 text-sm text-nhan">{rong}</p> : null}
    </The>
  );
}

export function AdminQueues({ data }: { data: DuLieuChatLuong }) {
  const ngay = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("vi-VN") : "Chưa xác minh";

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Khung
        tieuDe="Văn bản cần kiểm tra"
        phu="Parser để lại cảnh báo khi bóc tách"
        rong={data.warningDocs.length === 0 ? "Không còn văn bản nào chờ kiểm." : undefined}
      >
        {data.warningDocs.map((m) => (
          <Link
            key={m.id}
            href={`/documents/${m.id}`}
            className="flex items-baseline justify-between gap-3 rounded-[--bo] bg-khay px-3.5 py-2.5 text-sm transition-colors duration-[--nhip] hover:bg-khay-sau"
          >
            <span className="min-w-0">
              <span className="so-hieu block text-but-xanh font-medium">
                {m.so_hieu ?? "Không có số hiệu"}
              </span>
              {m.trich_yeu ? (
                <span className="mt-0.5 block line-clamp-1 text-xs text-nhan">
                  {m.trich_yeu}
                </span>
              ) : null}
            </span>
            <span className="so-hieu shrink-0 text-xs tabular-nums text-amber-700 font-semibold">
              {m.warning_count} cảnh báo
            </span>
          </Link>
        ))}
      </Khung>

      <Khung
        tieuDe="Metadata cũ hoặc chưa xác minh"
        phu="Sắp theo lần xác minh xa nhất"
        rong={data.staleDocs.length === 0 ? "Mọi văn bản đều đã được xác minh." : undefined}
      >
        {data.staleDocs.map((m) => (
          <Link
            key={m.id}
            href={`/documents/${m.id}`}
            className="flex items-baseline justify-between gap-3 rounded-[--bo] bg-khay px-3.5 py-2.5 text-sm transition-colors duration-[--nhip] hover:bg-khay-sau"
          >
            <span className="so-hieu min-w-0 truncate text-but-xanh font-medium">
              {m.so_hieu ?? "Không có số hiệu"}
            </span>
            <span className="shrink-0 text-xs text-nhan">{ngay(m.verified_at)}</span>
          </Link>
        ))}
      </Khung>

      <Khung tieuDe="Sức khỏe nguồn tin" phu="Lần lấy tin gần nhất và lỗi nếu có">
        {data.sources.map((n) => (
          <div
            key={n.id}
            className="flex items-baseline justify-between gap-3 rounded-[--bo] bg-khay px-3.5 py-2.5 text-sm"
          >
            <span className="min-w-0">
              <span className="block font-medium">{n.name}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-nhan">
                {n.last_error ? `Lần lấy gần nhất lỗi: ${n.last_error}` : "Đang chạy ổn định"}
              </span>
            </span>
            <span className="so-hieu shrink-0 text-xs tabular-nums text-nhan">
              {n.article_count} bài
            </span>
          </div>
        ))}
      </Khung>

      <Khung
        tieuDe="Truy vấn có điểm thấp"
        phu="Chỗ kho tài liệu chưa phủ được câu hỏi thật"
        rong={data.lowQueries.length === 0 ? "Chưa ghi nhận truy vấn yếu nào." : undefined}
      >
        {data.lowQueries.map((c, i) => (
          <div
            key={`${c.created_at}-${i}`}
            className="flex items-start gap-3 rounded-[--bo] bg-khay px-3.5 py-2.5 text-sm"
          >
            <span className="so-hieu shrink-0 font-medium tabular-nums text-amber-700">
              {c.diem_cao_nhat?.toFixed(2).replace(".", ",") ?? "—"}
            </span>
            <span className="leading-relaxed">{c.cau_hoi}</span>
          </div>
        ))}
      </Khung>
    </div>
  );
}
