"use client";

import type { StatsResponse } from "@/types/contract";
import type { CoverageRow } from "@/types/platform";
import { HangSoLieu, OSoLieu, The, TieuDeMuc } from "@/components/kit/co-ban";
import { CotDoc, CotNgang } from "@/components/kit/bieu-do";
import { NHAN_LOAI, chuanHoaTenCoQuan } from "@/types/nhan";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";

const phanTram = (v: number) => `${Math.round(v * 100)}%`;

export function CorpusOverview({
  stats,
  phuSong,
}: {
  stats: StatsResponse;
  phuSong: CoverageRow[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <TieuDeMuc phu="Đọc từ bảng documents và chunks">Khu A — Kho văn bản</TieuDeMuc>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <OSoLieu
          nhan="Văn bản trong kho"
          giaTri={String(stats.tongVanBan)}
          phu={`Từ ${stats.theoCoQuan.length} cơ quan ban hành`}
        />
        <HangSoLieu
          cacMuc={[
            {
              nhan: "Đoạn đã bóc tách",
              giaTri: stats.tongChunk.toLocaleString("vi-VN"),
              phu:
                stats.tongVanBan > 0
                  ? `Trung bình ${Math.round(stats.tongChunk / stats.tongVanBan)} đoạn mỗi văn bản`
                  : undefined,
            },
            {
              nhan: "Bóc tách sạch",
              giaTri: phanTram(stats.tyLeParseSach),
              phu: "Văn bản không có cảnh báo nào",
            },
            {
              nhan: "Khoảng năm ban hành",
              giaTri:
                stats.theoNam.length > 0
                  ? `${stats.theoNam[0].nam}–${stats.theoNam[stats.theoNam.length - 1].nam}`
                  : "—",
            },
          ]}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <The className="sang-khi-cham">
          <TieuDeMuc>Theo loại văn bản</TieuDeMuc>
          <div className="mt-4">
            <CotNgang
              cacMuc={stats.theoLoai.map((m) => ({
                nhan: NHAN_LOAI[m.loai],
                giaTri: m.soLuong,
              }))}
            />
          </div>
        </The>

        <The className="sang-khi-cham">
          <TieuDeMuc phu="Sáu cơ quan có nhiều văn bản nhất">Theo cơ quan</TieuDeMuc>
          <div className="mt-4">
            <CotNgang
              toiDaHien={6}
              cacMuc={stats.theoCoQuan.map((m) => ({
                nhan: chuanHoaTenCoQuan(m.coQuan),
                giaTri: m.soLuong,
              }))}
            />
          </div>
        </The>

        <The className="sang-khi-cham">
          <TieuDeMuc>Theo năm ban hành</TieuDeMuc>
          <div className="mt-4">
            <CotDoc
              cacMuc={stats.theoNam.map((m) => ({
                nhan: String(m.nam),
                giaTri: m.soLuong,
              }))}
            />
          </div>
        </The>
      </div>

      {phuSong.length > 0 ? (
        <The khongDem className="sang-khi-cham">
          <div className="p-4 sm:p-5">
            <TieuDeMuc phu="Corpus đang phủ tới đâu ở từng chủ đề">
              Ma trận phạm vi hỗ trợ
            </TieuDeMuc>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead>
                <tr className="border-y border-ke-mo bg-khay/40">
                  <th className="nhan-hoa px-4 py-2.5 font-semibold sm:px-5">Chủ đề</th>
                  <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Văn bản</th>
                  <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Đoạn</th>
                  <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">
                    Đã xác minh
                  </th>
                  <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">
                    Cảnh báo
                  </th>
                  <th className="nhan-hoa px-4 py-2.5 font-semibold sm:px-5">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {phuSong.map((h) => (
                  <tr key={h.topic} className="border-b border-ke-mo transition-colors hover:bg-khay/50 last:border-0">
                    <td className="px-4 py-2.5 font-medium sm:px-5">
                      {NHAN_CHU_DE_TIN[h.topic]}
                    </td>
                    <td className="so-hieu px-4 py-2.5 text-right tabular-nums">
                      {h.documents}
                    </td>
                    <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan">
                      {h.chunks}
                    </td>
                    <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-emerald-700 font-medium">
                      {h.verifiedDocuments}
                    </td>
                    <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-amber-700">
                      {h.warningDocuments}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-nhan sm:px-5">
                      {h.lastVerifiedAt
                        ? new Date(h.lastVerifiedAt).toLocaleDateString("vi-VN")
                        : "Chưa có"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </The>
      ) : null}
    </section>
  );
}
