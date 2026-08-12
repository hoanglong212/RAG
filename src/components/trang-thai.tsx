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
  tongVanBan?: number;
  tongChunk?: number;
}

const soNhom = (n: number) => n.toLocaleString("vi-VN");

/**
 * Màn mở màn. Đây là chỗ DUY NHẤT trong sản phẩm được phép to tiếng —
 * mọi màn khác đều có dữ liệu thật để nói thay.
 *
 * Ba việc nó phải làm, theo đúng thứ tự: nói sản phẩm hứa gì, chứng minh
 * lời hứa đó có thật bằng số đo của kho tài liệu, rồi mời gõ câu đầu tiên.
 */
export function TrangThaiRong({
  cauHoiGoiY,
  onChonCauHoi,
  tongVanBan,
  tongChunk,
}: TrangThaiRongProps) {
  const coSo = typeof tongVanBan === "number" && tongVanBan > 0;

  return (
    <div className="hien-len py-2">
      {/*
        Con dấu ở đây KHÔNG phá kỷ luật màu: nó đứng cạnh đúng lời hứa về
        trích dẫn, mà lời hứa đó chính là nghĩa của màu đỏ trong sản phẩm này.
      */}
      <ConDau co={52} className="mb-5 block" />

      <h2 className="chu-trung-bay text-[2rem] sm:text-[2.5rem]">
        Hỏi một câu.
        <br />
        Nhận về đúng Điều.
      </h2>

      <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-nhan">
        Mỗi câu trả lời đều đóng dấu về Điều, Khoản trong văn bản gốc để bạn tự kiểm
        chứng. Không đủ căn cứ thì hệ thống nói thẳng là không tìm thấy, chứ không đoán.
      </p>

      {/* Số đo kho tài liệu: bằng chứng lời hứa trên có thật. */}
      {coSo ? (
        <dl className="ke-quoc-hieu mt-7 flex flex-wrap gap-x-10 gap-y-3 pb-4">
          <div>
            <dt className="nhan-hoa">Văn bản trong kho</dt>
            <dd className="chu-trung-bay mt-1 font-ma text-[1.5rem] tabular-nums">
              {soNhom(tongVanBan)}
            </dd>
          </div>
          {typeof tongChunk === "number" && tongChunk > 0 ? (
            <div>
              <dt className="nhan-hoa">Đoạn đã bóc tách</dt>
              <dd className="chu-trung-bay mt-1 font-ma text-[1.5rem] tabular-nums">
                {soNhom(tongChunk)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="nhan-hoa">Độ sâu trích dẫn</dt>
            <dd className="chu-trung-bay mt-1 text-[1.5rem]">Tới Khoản</dd>
          </div>
        </dl>
      ) : null}

      <p className="nhan-hoa mt-8">Thử một câu</p>
      <ul className="mt-2.5 flex flex-col gap-2">
        {cauHoiGoiY.map((cau, i) => (
          <li key={cau}>
            <button
              type="button"
              onClick={() => onChonCauHoi(cau)}
              className={cn(
                "group flex w-full items-center gap-3.5 rounded-[--bo-lon] bg-giay py-3.5 pl-4 pr-3.5",
                "text-left text-[0.9375rem] leading-snug shadow-the",
                "transition-[box-shadow,transform] duration-[--nhip]",
                "hover:-translate-y-px hover:shadow-vua",
              )}
            >
              <span className="so-hieu shrink-0 text-nhan">0{i + 1}</span>
              <span className="flex-1">{cau}</span>
              <span
                aria-hidden
                className="shrink-0 text-lg leading-none text-nhan transition-[transform,color] duration-[--nhip] group-hover:translate-x-0.5 group-hover:text-but-xanh"
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
