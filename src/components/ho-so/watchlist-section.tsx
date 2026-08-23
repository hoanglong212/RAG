"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { OChon, ONhap } from "@/components/kit/truong";
import type { NewsTopic } from "@/types/news";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";
import type { WatchlistView } from "@/types/platform";

const CHU_DE: NewsTopic[] = [
  "an_toan_thuc_pham",
  "lao_dong",
  "giao_thong",
  "dat_dai_nha_o",
  "nguoi_tieu_dung",
];

export function WatchlistSection({
  danhSach,
  onTao,
  onDaXem,
  onXoa,
}: {
  danhSach: WatchlistView[];
  onTao: (ten: string, chuDe: NewsTopic) => void;
  onDaXem: (id: string) => void;
  onXoa: (id: string) => void;
}) {
  const [ten, setTen] = useState("");
  const [chuDe, setChuDe] = useState<NewsTopic>("giao_thong");

  return (
    <The className="flex flex-col gap-4 print:hidden sang-khi-cham">
      <TieuDeMuc phu="Báo khi có văn bản hoặc tin mới thuộc chủ đề bạn chọn">
        Theo dõi thay đổi
      </TieuDeMuc>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <ONhap
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          placeholder="Đặt tên, ví dụ: Xe máy của tôi"
          aria-label="Tên theo dõi"
        />
        <OChon
          value={chuDe}
          onChange={(e) => setChuDe(e.target.value as NewsTopic)}
          aria-label="Chủ đề theo dõi"
        >
          {CHU_DE.map((t) => (
            <option key={t} value={t}>
              {NHAN_CHU_DE_TIN[t]}
            </option>
          ))}
        </OChon>
        <Nut
          onClick={() => {
            onTao(ten.trim(), chuDe);
            setTen("");
          }}
        >
          Theo dõi
        </Nut>
      </div>

      {danhSach.length === 0 ? (
        <p className="text-sm leading-relaxed text-nhan">
          Chưa theo dõi gì. Tạo một mục để biết khi nào có văn bản hoặc tin mới động tới
          lĩnh vực bạn quan tâm.
        </p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {danhSach.map((t) => (
            <li key={t.id} className="rounded-[--bo] bg-khay p-3.5 transition-colors hover:bg-khay-sau/70">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {t.alerts.length > 0 ? (
                    <BellRing className="size-3.5 text-but-xanh nhip-tho" strokeWidth={2} />
                  ) : null}
                  {t.name}
                </span>
                <span className="text-xs text-nhan">
                  {t.alerts.length > 0 ? `${t.alerts.length} mục mới` : "Chưa có gì mới"}
                </span>
              </div>

              {t.alerts.slice(0, 3).map((c) => (
                <a
                  key={`${c.kind}-${c.id}`}
                  href={c.href}
                  className="mt-1.5 block line-clamp-1 text-xs text-nhan underline-offset-4 hover:text-but-xanh hover:underline"
                >
                  {c.kind === "news" ? "Tin" : "Văn bản"}: {c.title}
                </a>
              ))}

              <div className="mt-3 flex flex-wrap gap-2">
                {t.alerts.length > 0 ? (
                  <Nut kieu="vien" co="nho" onClick={() => onDaXem(t.id)}>
                    Đánh dấu đã xem
                  </Nut>
                ) : null}
                <Nut kieu="lang" co="nho" onClick={() => onXoa(t.id)}>
                  Bỏ theo dõi
                </Nut>
              </div>
            </li>
          ))}
        </ul>
      )}
    </The>
  );
}
