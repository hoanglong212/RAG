"use client";

/**
 * Trang tra cứu — màn hình chính.
 *
 * Chạy hoàn toàn trên src/mocks/ cho tới ngày gộp. Ngày gộp chỉ đổi nguồn dữ
 * liệu sang /api/chat, không sửa component nào ở đây.
 *
 * KHOẢNH KHẮC CHỮ KÝ: contract quy định /api/chat gửi sự kiện `citations`
 * TRƯỚC rồi mới tới `token`. Trang này diễn đúng thứ tự đó — trục văn bản cuộn
 * tới Điều được trích và đóng dấu đỏ trong khi câu trả lời còn chưa hiện chữ
 * nào. Chỗ đến có trước, lời giải thích tới sau.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatResponse, Citation } from "@/types/contract";
import { chatDiemThap, chatKhongTimThay, chatLoi, chatOk, cauHoiGoiY } from "@/mocks/chat";
import { chiTietVanBanDayDu } from "@/mocks/detail";
import { mockStats } from "@/mocks/stats";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { MatDoc } from "@/components/mat-doc";
import { OHoi } from "@/components/o-hoi";
import { TrucVanBan } from "@/components/truc-van-ban";
import {
  DangTai,
  KhongTimThay,
  TrangThaiLoi,
  TrangThaiRong,
} from "@/components/trang-thai";
import { cn } from "@/lib/utils";

/**
 * Ngưỡng để hiển thị. Bản thật đọc từ NGUONG_DIEM_TOI_THIEU qua /api/chat;
 * mock chưa mang theo trường này nên tạm ghim ở đây, đúng giá trị mặc định.
 */
const NGUONG = 0.35;

/** Độ trễ giả lập, chỉ để diễn thứ tự sự kiện của contract trên mock. */
const TRE_TIM_NGUON = 700;
const TRE_VIET_CHU = 900;

type Pha = "rong" | "dangTim" | "coNguon" | "xong" | "khongTimThay" | "loi";

const KICH_BAN = {
  ok: chatOk,
  diemThap: chatDiemThap,
  khongTimThay: chatKhongTimThay,
  loi: chatLoi,
} as const;

type TenKichBan = keyof typeof KICH_BAN;

const NHAN_KICH_BAN: Record<TenKichBan, string> = {
  ok: "Điểm cao",
  diemThap: "Điểm thấp",
  khongTimThay: "Không tìm thấy",
  loi: "Lỗi",
};

export default function TrangTraCuu() {
  const [cauHoi, setCauHoi] = useState("");
  const [pha, setPha] = useState<Pha>("rong");
  const [kichBan, setKichBan] = useState<TenKichBan>("ok");
  const [phanHoi, setPhanHoi] = useState<ChatResponse | null>(null);
  const [trichDanDangChon, setTrichDanDangChon] = useState<Citation | null>(null);

  const dongHo = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const ds = dongHo.current;
    return () => ds.forEach(clearTimeout);
  }, []);

  const traCuu = useCallback(() => {
    dongHo.current.forEach(clearTimeout);
    dongHo.current = [];
    setPhanHoi(null);
    setTrichDanDangChon(null);
    setPha("dangTim");

    const ketQua = KICH_BAN[kichBan];

    dongHo.current.push(
      setTimeout(() => {
        if (ketQua.status === "khong_tim_thay") {
          setPhanHoi(ketQua);
          setPha("khongTimThay");
          return;
        }
        if (ketQua.status === "loi") {
          setPhanHoi(ketQua);
          setPha("loi");
          return;
        }
        // Nguồn về trước: trục cuộn và đóng dấu, chữ chưa có.
        setPhanHoi(ketQua);
        setTrichDanDangChon(ketQua.citations[0] ?? null);
        setPha("coNguon");
        dongHo.current.push(setTimeout(() => setPha("xong"), TRE_VIET_CHU));
      }, TRE_TIM_NGUON),
    );
  }, [kichBan]);

  const coVanBan = pha === "coNguon" || pha === "xong";
  const dangChay = pha === "dangTim" || pha === "coNguon";

  return (
    <div className="flex h-full">
      {/* ---------- Cột trái: trục văn bản ---------- */}
      {coVanBan ? (
        <TrucVanBan
          soHieu={chiTietVanBanDayDu.soHieu}
          tree={chiTietVanBanDayDu.tree}
          nodeIdDangNeo={trichDanDangChon?.nodeId ?? null}
          moRong
          onChon={(nodeId) =>
            setTrichDanDangChon(
              phanHoi?.citations.find((c) => c.nodeId === nodeId) ??
                trichDanDangChon,
            )
          }
          className="hidden shrink-0 lg:flex"
        />
      ) : (
        <div className="hidden w-80 shrink-0 flex-col px-3 pt-3 lg:flex">
          <p className="nhan-hoa">Trục văn bản</p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-nhan">
            Trục hiện ra khi có câu trả lời, và cuộn tới đúng Điều được trích dẫn.
          </p>
        </div>
      )}

      {/* ---------- Cột giữa: hỏi và đáp ---------- */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-5 py-4">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          <OHoi
            giaTri={cauHoi}
            onDoi={setCauHoi}
            onTraCuu={traCuu}
            dangChay={dangChay}
          />

          <div className="mt-6 flex-1">
            {pha === "rong" ? (
              <TrangThaiRong cauHoiGoiY={cauHoiGoiY} onChonCauHoi={setCauHoi} />
            ) : null}

            {pha === "dangTim" ? <DangTai /> : null}

            {pha === "khongTimThay" && phanHoi ? (
              <KhongTimThay
                topScore={phanHoi.topScore}
                nguong={NGUONG}
                soVanBan={mockStats.tongVanBan}
              />
            ) : null}

            {pha === "loi" ? <TrangThaiLoi onThuLai={traCuu} /> : null}

            {coVanBan && phanHoi ? (
              <div className="flex flex-col gap-6">
                {/* Nguồn đứng TRÊN câu trả lời, đúng thứ tự chúng về. */}
                <section>
                  <h2 className="nhan-hoa mb-2">
                    Nguồn ({phanHoi.citations.length})
                  </h2>
                  <ul className="flex flex-col gap-1.5">
                    {phanHoi.citations.map((td, i) => (
                      <li key={td.chunkId}>
                        <ChipTrichDan
                          trichDan={td}
                          soThuTu={i + 1}
                          dangChon={trichDanDangChon?.chunkId === td.chunkId}
                          onChon={setTrichDanDangChon}
                        />
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="nhan-hoa mb-2">Trả lời</h2>
                  {pha === "coNguon" ? (
                    <p className="text-sm text-nhan">Đang soạn câu trả lời…</p>
                  ) : (
                    <p className="text-[0.9375rem] leading-[--dong-body]">
                      {phanHoi.answer}
                    </p>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* ---------- Cột phải: mặt đọc ---------- */}
      <div className="hidden w-[38rem] shrink-0 xl:block">
        {trichDanDangChon ? (
          <MatDoc
            tree={chiTietVanBanDayDu.tree}
            nodeIdDangNeo={trichDanDangChon.nodeId}
            className="h-full"
          />
        ) : (
          <div className="mat-doc flex h-full items-center justify-center px-10">
            <p className="max-w-xs text-center text-sm text-nhan">
              Bấm một nguồn để mở văn bản gốc tại đúng Khoản được trích dẫn.
            </p>
          </div>
        )}
      </div>

      {/* Bộ chọn kịch bản — chỉ có khi phát triển, để soi đủ bốn trạng thái. */}
      {process.env.NODE_ENV !== "production" ? (
        <div className="fixed bottom-3 left-3 z-50 flex items-center gap-1 rounded-[--bo-lon] bg-muc-in/90 p-1">
          {(Object.keys(KICH_BAN) as TenKichBan[]).map((ten) => (
            <button
              key={ten}
              type="button"
              onClick={() => setKichBan(ten)}
              className={cn(
                "rounded-[--bo] px-2 py-1 text-xs text-giay/70 transition-colors",
                kichBan === ten && "bg-giay/15 text-giay",
              )}
            >
              {NHAN_KICH_BAN[ten]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
