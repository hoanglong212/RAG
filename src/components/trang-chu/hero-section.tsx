"use client";

import type { StatsResponse } from "@/types/contract";
import { ConDau } from "@/components/kit/con-dau";
import { SoDemLen } from "@/components/kit/so-dem-len";

export function HeroSection({ stats }: { stats: StatsResponse | null }) {
  return (
    <section className="mo-man relative overflow-hidden rounded-[--bo-lon] px-6 py-9 text-giay shadow-noi sm:px-10 sm:py-12">
      {/* Dynamic ambient particles / lighting overlay */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-2xl" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <ConDau co={52} className="block transition-transform duration-300 hover:scale-105" />
          <span className="rounded-full bg-giay/10 px-3 py-1 text-xs font-semibold tracking-wider text-giay/90 uppercase backdrop-blur-md">
            Hệ thống RAG Pháp luật 2.0
          </span>
        </div>

        {/*
          Nhấn vào vế sau bằng ĐỘ SÁNG, không bằng gradient. Chữ đổ màu là
          trang trí thuần: nó không mang thêm nghĩa nào, và là một trong những
          dấu hiệu dễ nhận nhất của giao diện do máy sinh. Ở đây vế đầu lùi
          xuống, vế sau — cái sản phẩm hứa — đứng ở độ sáng đầy.
        */}
        <h1 className="chu-trung-bay co-trung-bay max-w-3xl leading-tight">
          <span className="text-giay/70">Câu hỏi vào.</span>
          <br />
          <span className="text-giay">Điều, Khoản ra.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-giay/80 font-normal">
          Công cụ tra cứu văn bản quy phạm pháp luật Việt Nam. Hỏi bằng tiếng Việt
          thường, nhận câu trả lời có đóng dấu về đúng Điều, Khoản trong văn bản gốc.
          Không đủ căn cứ thì hệ thống nói thẳng là không tìm thấy, chứ không đoán.
        </p>

        {stats ? (
          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-t border-giay/15 pt-6">
            <div className="group">
              <dt className="nhan-hoa-sang">Văn bản trong kho</dt>
              <dd className="chu-trung-bay co-so-lieu mt-2 font-ma tabular-nums transition-transform duration-200 group-hover:scale-105">
                <SoDemLen denSo={stats.tongVanBan} />
              </dd>
            </div>
            <div className="group">
              <dt className="nhan-hoa-sang">Đoạn đã bóc tách</dt>
              <dd className="chu-trung-bay co-so-lieu mt-2 font-ma tabular-nums transition-transform duration-200 group-hover:scale-105">
                <SoDemLen denSo={stats.tongChunk} />
              </dd>
            </div>
            <div className="group">
              <dt className="nhan-hoa-sang">Cơ quan ban hành</dt>
              <dd className="chu-trung-bay co-so-lieu mt-2 font-ma tabular-nums transition-transform duration-200 group-hover:scale-105">
                <SoDemLen denSo={stats.theoCoQuan.length} />
              </dd>
            </div>
            <div>
              <dt className="nhan-hoa-sang">Độ sâu trích dẫn</dt>
              <dd className="chu-trung-bay co-so-lieu mt-2 text-giay">Tới Khoản</dd>
            </div>
          </dl>
        ) : (
          <div className="mt-10 flex gap-10 border-t border-giay/15 pt-6">
            {[0, 1, 2].map((i) => (
              <span key={i} className="luot-sang block h-10 w-24 rounded-[--bo] bg-giay/15" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
