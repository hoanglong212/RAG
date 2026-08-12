"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { XemVanBan } from "@/components/xem-van-ban";
import { docLoi, layJson } from "@/components/kit/goi-api";
import type { DocumentDetail } from "@/types/contract";

export default function TrangChiTietVanBan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [chiTiet, setChiTiet] = useState<DocumentDetail | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void layJson<DocumentDetail>(`/api/documents/${encodeURIComponent(id)}`)
      .then((data) => {
        if (active) setChiTiet(data);
      })
      .catch((error: unknown) => {
        if (active) setLoi(docLoi(error));
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loi) {
    return <p className="px-6 py-5 text-sm text-dau-do">{loi}</p>;
  }
  if (!chiTiet) {
    return <p className="px-6 py-5 text-sm text-nhan">Đang mở văn bản…</p>;
  }
  if (chiTiet.tree.length === 0) {
    return (
      <div className="px-6 py-5">
        <h1 className="text-lg font-semibold">{chiTiet.trichYeu ?? chiTiet.soHieu ?? "Văn bản"}</h1>
        <p className="mt-2 text-sm text-nhan">
          Văn bản này chưa có cây điều khoản để hiển thị. Bạn vẫn có thể tìm nội dung bằng trang Tra cứu.
        </p>
      </div>
    );
  }

  return <XemVanBan chiTiet={chiTiet} nodeBanDau={searchParams.get("node")} />;
}
