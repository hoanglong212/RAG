"use client";

import { ScrollText } from "lucide-react";
import { Nut, The } from "@/components/kit/co-ban";
import { OVanBanTuGian } from "@/components/kit/truong";

const VI_DU =
  "Ngày 05/8/2026, Nam mượn xe máy của Hùng trong 3 ngày để về quê. Hùng giao cả xe lẫn giấy đăng ký bản gốc. Nam không về quê mà đem xe bán cho anh Minh với giá 45 triệu đồng…";

export function ScenarioForm({
  tinhHuong,
  setTinhHuong,
  dangChay,
  duDai,
  onGui,
}: {
  tinhHuong: string;
  setTinhHuong: (s: string) => void;
  dangChay: boolean;
  duDai: boolean;
  onGui: () => void;
}) {
  const soChu = tinhHuong.trim().length;

  return (
    <The className="flex flex-col gap-4 sang-khi-cham">
      <div className="flex flex-col gap-2">
        <label htmlFor="tinh-huong" className="nhan-hoa">
          Diễn biến sự việc
        </label>
        <OVanBanTuGian
          id="tinh-huong"
          rows={6}
          value={tinhHuong}
          onChange={(e) => setTinhHuong(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              if (duDai && !dangChay) onGui();
            }
          }}
          placeholder={`Càng nhiều mốc thời gian và con số, kết quả càng bám sát.\n\nVí dụ: ${VI_DU}`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {tinhHuong.length === 0 ? (
            <button
              type="button"
              onClick={() => setTinhHuong(VI_DU)}
              className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-but-xanh underline-offset-4 hover:underline"
            >
              <ScrollText className="size-3.5" strokeWidth={1.9} />
              Điền một ví dụ
            </button>
          ) : (
            <span className="so-hieu text-xs tabular-nums text-nhan">
              {soChu.toLocaleString("vi-VN")} ký tự
            </span>
          )}
          <span className="hidden text-xs text-nhan sm:inline">
            <kbd className="font-ma bg-khay px-1 rounded">Ctrl</kbd> + <kbd className="font-ma bg-khay px-1 rounded">Enter</kbd> để kiểm tra
          </span>
        </div>

        <Nut disabled={dangChay || !duDai} onClick={onGui}>
          {dangChay ? "Đang tìm căn cứ…" : "Kiểm tra với pháp luật"}
        </Nut>
      </div>
    </The>
  );
}
