"use client";

/**
 * Bốn trạng thái của trục hỏi đáp. Dựng cùng lúc với trạng thái có dữ liệu,
 * không để sau — đây là những màn hình dễ vỡ nhất lúc demo trực tiếp.
 *
 * Nguyên tắc chữ nghĩa: gọi tên theo thứ người dùng nhận ra, không theo cách
 * hệ thống vận hành. Lỗi không xin lỗi và không mơ hồ về chuyện đã xảy ra.
 */

import { Nut, The } from "@/components/kit/co-ban";
import { ConDau } from "@/components/kit/con-dau";
import { cn } from "@/lib/utils";

const soVN = (n: number) => n.toFixed(2).replace(".", ",");

/* ------------------------------------------------------------------ */

export interface TrangThaiRongProps {
  cauHoiGoiY: string[];
  onChonCauHoi: (cauHoi: string) => void;
}

/** Màn hình trống là lời mời hành động, không phải thông báo buồn. */
export function TrangThaiRong({ cauHoiGoiY, onChonCauHoi }: TrangThaiRongProps) {
  return (
    <div className="py-2">
      {/*
        Màn hình mở màn là chỗ duy nhất được phép to tiếng. Con dấu ở đây
        KHÔNG phá kỷ luật màu: nó đứng cạnh chính lời hứa về trích dẫn, và
        lời hứa đó là nghĩa của màu đỏ trong sản phẩm này.
      */}
      <div className="flex items-start gap-4">
        <ConDau co={44} className="mt-1 hidden sm:block" />
        <div className="min-w-0">
          <h2 className="chu-trung-bay text-[1.75rem] sm:text-[2.125rem]">
            Hỏi một câu.
            <br />
            Nhận về đúng Điều.
          </h2>
          <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-nhan">
            Mỗi câu trả lời đều đóng dấu về Điều, Khoản trong văn bản gốc để bạn tự kiểm
            chứng. Không đủ căn cứ thì hệ thống nói thẳng là không tìm thấy, chứ không
            đoán.
          </p>
        </div>
      </div>

      <p className="nhan-hoa mt-8">Thử một câu</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {cauHoiGoiY.map((cau) => (
          <li key={cau}>
            <button
              type="button"
              onClick={() => onChonCauHoi(cau)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-[--bo] bg-giay px-3.5 py-3",
                "text-left text-sm shadow-the",
                "transition-shadow duration-[--nhip] hover:shadow-noi",
              )}
            >
              <span className="flex-1">{cau}</span>
              <span
                aria-hidden
                className="shrink-0 text-nhan transition-transform duration-[--nhip] group-hover:translate-x-0.5"
              >
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Đang tra cứu. Thứ tự các dòng phản ánh đúng thứ tự sự kiện của /api/chat:
 * nguồn về trước, câu trả lời chảy ra sau.
 */
export function DangTai() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-live="polite">
      <section>
        <p className="nhan-hoa mb-2.5">Đang tìm trong kho văn bản…</p>
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-[--bo] bg-giay px-3 py-3 shadow-the"
              style={{ animationDelay: `${i * 140}ms` }}
            >
              <span className="block h-2.5 w-32 rounded-[--bo] bg-khay-sau" />
              <span className="mt-2.5 block h-2.5 w-full rounded-[--bo] bg-khay-sau" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export interface KhongTimThayProps {
  topScore: number;
  nguong: number;
  soVanBan: number;
}

/**
 * Câu quan trọng nhất toàn hệ thống. Đây KHÔNG phải lỗi — nó là một câu trả lời
 * hợp lệ, nên nó được một trạng thái đàng hoàng chứ không dùng lại khung lỗi.
 *
 * Không có chấm đỏ nào ở màn hình này, và đó là chủ ý: vắng dấu chứng thực
 * nghĩa là hệ thống không khẳng định gì.
 */
export function KhongTimThay({ topScore, nguong, soVanBan }: KhongTimThayProps) {
  const tyLe = nguong > 0 ? Math.min(100, (topScore / nguong) * 100) : 0;

  return (
    <The className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Không tìm thấy trong bộ tài liệu</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-nhan">
          {soVanBan > 0 ? `Đã tìm trong ${soVanBan} văn bản. ` : ""}
          Đoạn gần nhất chỉ đạt {soVN(topScore)}, dưới ngưỡng tin cậy {soVN(nguong)} — chưa
          đủ căn cứ để trích dẫn, nên hệ thống không đưa ra câu trả lời.
        </p>
      </div>

      {/* Khoảng cách tới ngưỡng, hiện thành hình để thấy còn thiếu bao nhiêu. */}
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-khay-sau">
          <span
            className="block h-full rounded-full bg-nhan/60"
            style={{ width: `${Math.max(2, tyLe)}%` }}
          />
        </span>
        <span className="so-hieu shrink-0 text-xs tabular-nums text-nhan">
          {soVN(topScore)} / {soVN(nguong)}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-nhan">
        Thử hỏi lại bằng từ ngữ có trong văn bản, hoặc nêu rõ số hiệu văn bản cần tra.
      </p>
    </The>
  );
}

/* ------------------------------------------------------------------ */

export interface TrangThaiLoiProps {
  onThuLai?: () => void;
}

/** Hạ tầng hỏng. Nói thẳng chuyện gì đã xảy ra, không xin lỗi. */
export function TrangThaiLoi({ onThuLai }: TrangThaiLoiProps) {
  return (
    <div
      role="alert"
      className="rounded-[--bo-lon] bg-giay py-4 pl-4 pr-5 shadow-the [border-left:3px_solid_var(--muc-in)]"
    >
      <h2 className="text-base font-semibold">Không gửi được câu hỏi</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-nhan">
        Máy chủ tra cứu không phản hồi. Câu hỏi của bạn chưa được xử lý và không có gì bị
        mất.
      </p>
      {onThuLai ? (
        <Nut kieu="phu" className="mt-3.5" onClick={onThuLai}>
          Tra cứu lại
        </Nut>
      ) : null}
    </div>
  );
}
