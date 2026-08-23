"use client";

import { OSoLieu } from "@/components/kit/co-ban";

interface SummaryData {
  documents: number;
  warning_documents: number;
  unverified_documents: number;
  disabled_documents: number;
}

export function AdminSummary({ summary }: { summary: SummaryData }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <OSoLieu nhan="Văn bản trong kho" giaTri={String(summary.documents)} />
      <OSoLieu
        nhan="Có cảnh báo bóc tách"
        giaTri={String(summary.warning_documents)}
        phu="Cần mở ra đối chiếu với bản gốc"
      />
      <OSoLieu
        nhan="Chưa xác minh"
        giaTri={String(summary.unverified_documents)}
        phu="Metadata chưa ai soát lại"
      />
      <OSoLieu
        nhan="Đã tắt truy hồi"
        giaTri={String(summary.disabled_documents)}
        phu="Không tham gia tra cứu"
      />
    </div>
  );
}
