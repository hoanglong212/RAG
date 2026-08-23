"use client";

/**
 * Quản trị chất lượng — hàng đợi việc cần người xử lý.
 *
 * Tất cả giao diện đã được tách thành các component trong `@/components/quan-tri`.
 */

import { useCallback, useEffect, useState } from "react";
import { KhungTrang } from "@/components/kit/co-ban";
import { BaoLoi, TrongRong, XuongSoLieu } from "@/components/kit/trang-thai-kit";
import { docLoi, layJson } from "@/components/kit/goi-api";

import { AdminSummary } from "@/components/quan-tri/admin-summary";
import { AdminQueues } from "@/components/quan-tri/admin-queues";

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
          <AdminSummary summary={data.summary} />
          <AdminQueues data={data} />
        </div>
      ) : null}

      {!dangTai && !data && !loi ? (
        <TrongRong tieuDe="Chưa có dữ liệu quản trị" moTa="Nạp văn bản và chạy tra cứu để hàng đợi có việc." />
      ) : null}
    </KhungTrang>
  );
}
