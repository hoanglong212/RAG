"use client";

import Link from "next/link";
import type { EvalRun } from "@/types/contract";
import { The, TieuDeMuc } from "@/components/kit/co-ban";
import { VongTienTrinh } from "@/components/kit/vong-tien-trinh";

const phanTram = (v: number) => `${Math.round(v * 100)}%`;

export function EvalBanner({ moiNhat }: { moiNhat: EvalRun | null }) {
  if (!moiNhat) return null;

  return (
    <The className="mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-l-4 border-l-but-xanh bg-gradient-to-r from-giay via-giay to-khay/40 shadow-vua">
      <div className="min-w-0 max-w-xl">
        <TieuDeMuc phu="Đo trên bộ câu hỏi vàng tự soạn, không phải cảm nhận. Mỗi lần chạy đổi đúng một biến để quy được nguyên nhân.">
          Hệ thống trả lời đúng tới đâu
        </TieuDeMuc>
      </div>

      <div className="flex flex-wrap items-center gap-8">
        <div className="flex items-center gap-3">
          <VongTienTrinh
            phanTram={moiNhat.recallAt5}
            co={54}
            doDay={4}
            mauNen="var(--khay-sau)"
            mauVach="var(--but-xanh)"
            nhan={phanTram(moiNhat.recallAt5)}
          />
          <div>
            <p className="nhan-hoa">Recall@5</p>
            <p className="text-xs text-nhan">5 kết quả đầu</p>
          </div>
        </div>

        <div>
          <p className="nhan-hoa">Câu hỏi vàng</p>
          <p className="chu-trung-bay co-so-lieu mt-1 font-ma tabular-nums text-muc-in">
            {moiNhat.nQuestions}
          </p>
        </div>

        <Link
          href="/dashboard"
          className="group flex items-center gap-1.5 pb-1 text-[0.8125rem] font-semibold text-but-xanh underline-offset-4 hover:underline"
        >
          <span>Xem toàn bộ số đo</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </The>
  );
}
