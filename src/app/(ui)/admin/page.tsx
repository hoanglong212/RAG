"use client";

/**
 * Quản trị chất lượng — hàng đợi việc cần người xử lý.
 *
 * Trang này không phải bảng thống kê để ngắm; mỗi dòng là một việc. Nên mọi
 * mục đều bấm được và dẫn thẳng tới văn bản cần kiểm, và ô số liệu ở trên nói
 * rõ còn bao nhiêu việc chứ không chỉ nói tổng cộng có bao nhiêu.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { KhungTrang, OSoLieu, The, TieuDeMuc } from "@/components/kit/co-ban";
import { BaoLoi, TrongRong, XuongSoLieu } from "@/components/kit/trang-thai-kit";
import { docLoi, layJson } from "@/components/kit/goi-api";

interface DuLieuChatLuong {
  summary: {
    documents: number;
    warning_documents: number;
    unverified_documents: number;
    disabled_documents: number;
  };
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
    <The className="flex min-h-0 flex-col">
      <TieuDeMuc phu={phu}>{tieuDe}</TieuDeMuc>
      <div className="mt-3 flex max-h-80 flex-col gap-1.5 overflow-y-auto">
        {children ?? null}
      </div>
      {rong ? <p className="mt-3 text-sm text-nhan">{rong}</p> : null}
    </The>
  );
}

export default function TrangQuanTriChatLuong() {
  const [data, setData] = useState<DuLieuChatLuong | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(true);

  const doc = useCallback(async () => {
    setDangTai(true);
    setLoi(null);
    try {
      setData(await layJson<DuLieuChatLuong>("/api/admin/quality"));
    } catch (e) {
      setLoi(docLoi(e));
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => void doc(), [doc]);

  const ngay = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("vi-VN") : "Chưa xác minh";

  return (
    <KhungTrang
      tieuDe="Quản trị chất lượng"
      moTa="Hàng đợi kiểm tra corpus, sức khỏe nguồn tin và những câu hỏi hệ thống trả lời kém nhất."
      rong="rong"
    >
      {dangTai ? <XuongSoLieu /> : null}
      {loi ? <BaoLoi moTa={loi} onThuLai={() => void doc()} /> : null}

      {data ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <OSoLieu nhan="Văn bản trong kho" giaTri={String(data.summary.documents)} />
            <OSoLieu
              nhan="Có cảnh báo bóc tách"
              giaTri={String(data.summary.warning_documents)}
              phu="Cần mở ra đối chiếu với bản gốc"
            />
            <OSoLieu
              nhan="Chưa xác minh"
              giaTri={String(data.summary.unverified_documents)}
              phu="Metadata chưa ai soát lại"
            />
            <OSoLieu
              nhan="Đã tắt truy hồi"
              giaTri={String(data.summary.disabled_documents)}
              phu="Không tham gia tra cứu"
            />
          </div>

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
                    <span className="so-hieu block text-but-xanh">
                      {m.so_hieu ?? "Không có số hiệu"}
                    </span>
                    {m.trich_yeu ? (
                      <span className="mt-0.5 block line-clamp-1 text-xs text-nhan">
                        {m.trich_yeu}
                      </span>
                    ) : null}
                  </span>
                  <span className="so-hieu shrink-0 text-xs tabular-nums text-nhan">
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
                  <span className="so-hieu min-w-0 truncate text-but-xanh">
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
                  <span className="so-hieu shrink-0 tabular-nums text-nhan">
                    {c.diem_cao_nhat?.toFixed(2).replace(".", ",") ?? "—"}
                  </span>
                  <span className="leading-relaxed">{c.cau_hoi}</span>
                </div>
              ))}
            </Khung>
          </div>
        </div>
      ) : null}

      {!dangTai && !data && !loi ? (
        <TrongRong tieuDe="Chưa có dữ liệu quản trị" moTa="Nạp văn bản và chạy tra cứu để hàng đợi có việc." />
      ) : null}
    </KhungTrang>
  );
}
