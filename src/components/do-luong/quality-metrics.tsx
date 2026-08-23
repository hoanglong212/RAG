"use client";

import type { EvalRun, StatsResponse } from "@/types/contract";
import { HangSoLieu, The, TieuDeMuc } from "@/components/kit/co-ban";
import { CotDocLon, CotNgang } from "@/components/kit/bieu-do";
import { VongTienTrinh } from "@/components/kit/vong-tien-trinh";

const phanTram = (v: number) => `${Math.round(v * 100)}%`;
const soVN = (v: number) => v.toFixed(2).replace(".", ",");
const tenNganGon = (ten: string) => ten.split("-")[0] || ten;

export function QualityMetrics({
  stats,
  lanChay,
}: {
  stats: StatsResponse;
  lanChay: EvalRun[];
}) {
  const moiNhat = lanChay.at(-1) ?? null;
  const chenhLech = moiNhat && lanChay.length > 1 ? moiNhat.recallAt5 - lanChay[0].recallAt5 : 0;

  return (
    <section className="flex flex-col gap-3">
      <TieuDeMuc phu="Đọc từ nhật ký truy vấn và các lần chạy eval">
        Khu B — Chất lượng hệ thống
      </TieuDeMuc>

      <HangSoLieu
        cacMuc={[
          {
            nhan: "Độ trễ trung vị",
            giaTri: `${stats.latencyP50} ms`,
            phu: `P95 ${stats.latencyP95} ms`,
          },
          {
            nhan: "Trả lời có trích dẫn",
            giaTri: phanTram(stats.tyLeCoTrichDan),
            phu: "Phần còn lại là câu hệ thống từ chối trả lời",
          },
          {
            nhan: "Câu hỏi vàng",
            giaTri: moiNhat ? String(moiNhat.nQuestions) : "—",
            phu: moiNhat ? `${lanChay.length} lần chạy đã ghi nhận` : undefined,
          },
        ]}
      />

      {/* ---- Biểu đồ chính: luận điểm định lượng ---- */}
      {lanChay.length > 0 ? (
        <The className="flex flex-col gap-6 lg:flex-row lg:items-stretch sang-khi-cham">
          <div className="flex shrink-0 flex-col justify-between gap-4 lg:w-72">
            <TieuDeMuc phu="Tỉ lệ câu hỏi vàng có đáp án đúng nằm trong 5 kết quả đầu">
              Recall@5 qua các lần chạy
            </TieuDeMuc>
            <div className="flex items-center gap-4">
              <VongTienTrinh
                phanTram={moiNhat ? moiNhat.recallAt5 : 0}
                co={72}
                doDay={6}
                mauNen="var(--khay-sau)"
                mauVach="var(--but-xanh)"
                nhan={moiNhat ? phanTram(moiNhat.recallAt5) : "0%"}
              />
              <div>
                <p className="chu-trung-bay co-so-lieu font-ma tabular-nums text-muc-in">
                  {moiNhat ? phanTram(moiNhat.recallAt5) : "—"}
                </p>
                {moiNhat && lanChay.length > 1 ? (
                  <p className="mt-1 text-xs leading-relaxed text-nhan">
                    <span className="so-hieu font-semibold text-emerald-700">
                      {chenhLech > 0 ? "+" : ""}
                      {Math.round(chenhLech * 100)} điểm
                    </span>{" "}
                    so với baseline
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <CotDocLon
              cacMuc={lanChay.map((r) => ({
                nhan: tenNganGon(r.configName),
                giaTri: r.recallAt5,
              }))}
            />
          </div>
        </The>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <The className="sang-khi-cham">
          <TieuDeMuc phu="Điểm của chunk tốt nhất mỗi lần hỏi">
            Phân bố điểm truy hồi
          </TieuDeMuc>
          <div className="mt-4">
            <CotNgang
              cacMuc={stats.phanBoScore.map((m) => ({
                nhan: m.khoang,
                giaTri: m.soLuong,
              }))}
            />
          </div>
        </The>

        <The className="sang-khi-cham">
          <TieuDeMuc phu="Đây là bản đồ lỗ hổng của kho dữ liệu">
            Câu hỏi có điểm thấp nhất
          </TieuDeMuc>
          {stats.cauHoiDiemThap.length > 0 ? (
            <ul className="mt-3.5 flex flex-col gap-1.5">
              {stats.cauHoiDiemThap.map((c) => (
                <li
                  key={`${c.at}-${c.question}`}
                  className="flex items-start gap-3 rounded-[--bo] bg-khay px-3.5 py-2.5 text-sm transition-colors hover:bg-khay-sau"
                >
                  <span className="so-hieu shrink-0 font-medium tabular-nums text-amber-700">
                    {soVN(c.topScore)}
                  </span>
                  <span className="leading-relaxed">{c.question}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-nhan">Chưa có truy vấn nào được ghi nhận.</p>
          )}
        </The>
      </div>
    </section>
  );
}
