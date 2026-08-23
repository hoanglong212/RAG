"use client";

import type { CoverageRow } from "@/types/platform";
import { The, TieuDeMuc } from "@/components/kit/co-ban";
import { CotNgang } from "@/components/kit/bieu-do";
import { Vach } from "@/components/kit/trang-thai-kit";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";

export function CoverageChart({ phuSong }: { phuSong: CoverageRow[] }) {
  return (
    <The className="flex flex-col gap-4">
      <TieuDeMuc phu="Số văn bản đang phục vụ tra cứu ở từng lĩnh vực">
        Kho đang phủ tới đâu
      </TieuDeMuc>
      {phuSong.length > 0 ? (
        <div className="mt-1">
          <CotNgang
            toiDaHien={6}
            cacMuc={[...phuSong]
              .sort((a, b) => b.documents - a.documents)
              .map((h) => ({
                nhan: NHAN_CHU_DE_TIN[h.topic],
                giaTri: h.documents,
              }))}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Vach key={i} />
          ))}
        </div>
      )}
    </The>
  );
}
