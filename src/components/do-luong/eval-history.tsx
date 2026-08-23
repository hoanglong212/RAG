"use client";

import type { EvalRun } from "@/types/contract";
import { The, TieuDeMuc } from "@/components/kit/co-ban";
import { BieuDoNho } from "@/components/kit/bieu-do";
import { TrongRong } from "@/components/kit/trang-thai-kit";

const phanTram = (v: number) => `${Math.round(v * 100)}%`;
const soVN = (v: number) => v.toFixed(2).replace(".", ",");
const tenNganGon = (ten: string) => ten.split("-")[0] || ten;

export function EvalHistory({ lanChay }: { lanChay: EvalRun[] }) {
  if (lanChay.length === 0) {
    return (
      <TrongRong
        tieuDe="Chưa chạy đánh giá lần nào"
        moTa="Chạy scripts/eval.ts để có con số đầu tiên. Không có bảng này thì hệ thống chỉ là một bản demo chạy được."
      />
    );
  }

  return (
    <The className="flex flex-col gap-5 sang-khi-cham">
      <TieuDeMuc phu="Mỗi lần chạy đổi đúng một biến, nên chênh lệch quy được về nguyên nhân">
        Các lần đánh giá truy hồi
      </TieuDeMuc>

      <div className="grid gap-6 sm:grid-cols-3">
        <BieuDoNho
          tieuDe="Recall@5"
          cacMuc={lanChay.map((r) => ({
            nhan: tenNganGon(r.configName),
            giaTri: r.recallAt5,
          }))}
          dinhDang={phanTram}
        />
        <BieuDoNho
          tieuDe="Recall@10"
          cacMuc={lanChay.map((r) => ({
            nhan: tenNganGon(r.configName),
            giaTri: r.recallAt10,
          }))}
          dinhDang={phanTram}
        />
        <BieuDoNho
          tieuDe="MRR"
          cacMuc={lanChay.map((r) => ({
            nhan: tenNganGon(r.configName),
            giaTri: r.mrr,
          }))}
        />
      </div>

      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead>
            <tr className="border-y border-ke-mo bg-khay/40">
              <th className="nhan-hoa px-4 py-2.5 font-semibold sm:px-5">Cấu hình</th>
              <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Recall@5</th>
              <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Recall@10</th>
              <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">MRR</th>
              <th className="nhan-hoa px-4 py-2.5 text-right font-semibold sm:px-5">
                Số câu
              </th>
            </tr>
          </thead>
          <tbody>
            {lanChay.map((r) => (
              <tr key={r.id} className="border-b border-ke-mo transition-colors hover:bg-khay/50 last:border-0">
                <td className="px-4 py-2.5 sm:px-5">
                  <span className="so-hieu font-semibold">{r.configName}</span>
                  {r.notes ? (
                    <span className="mt-0.5 block text-xs leading-relaxed text-nhan">
                      {r.notes}
                    </span>
                  ) : null}
                </td>
                <td className="so-hieu px-4 py-2.5 text-right tabular-nums font-semibold text-but-xanh">
                  {phanTram(r.recallAt5)}
                </td>
                <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan">
                  {phanTram(r.recallAt10)}
                </td>
                <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan">
                  {soVN(r.mrr)}
                </td>
                <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan sm:px-5">
                  {r.nQuestions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </The>
  );
}
