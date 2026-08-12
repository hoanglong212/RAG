"use client";

/**
 * Bốn trạng thái của trục hỏi đáp. Dựng cùng lúc với trạng thái có dữ liệu,
 * không để sau — đây là những màn hình dễ vỡ nhất lúc demo trực tiếp.
 *
 * Nguyên tắc chữ nghĩa: gọi tên theo thứ người dùng nhận ra, không theo cách
 * hệ thống vận hành. Lỗi không xin lỗi và không mơ hồ về chuyện đã xảy ra.
 */

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */

export interface TrangThaiRongProps {
  cauHoiGoiY: string[];
  onChonCauHoi: (cauHoi: string) => void;
}

/** Màn hình trống là lời mời hành động, không phải thông báo buồn. */
export function TrangThaiRong({ cauHoiGoiY, onChonCauHoi }: TrangThaiRongProps) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <h2 className="text-lg font-semibold">Hỏi một câu, nhận về đúng Điều</h2>
      <p className="mt-2 text-sm text-nhan">
        Mỗi câu trả lời đều kèm neo tới Điều, Khoản trong văn bản gốc để bạn tự kiểm
        chứng. Thử một trong ba câu dưới đây:
      </p>
      <ul className="mt-5 flex flex-col gap-2">
        {cauHoiGoiY.map((cau) => (
          <li key={cau}>
            <button
              type="button"
              onClick={() => onChonCauHoi(cau)}
              className={cn(
                "w-full rounded-[--bo] bg-khay/70 px-3.5 py-3 text-left text-sm",
                "transition-colors duration-[--nhip] hover:bg-khay-sau",
              )}
            >
              {cau}
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
    <div className="py-8" role="status" aria-live="polite">
      <p className="text-sm text-nhan">Đang tìm trong kho văn bản…</p>
      <div className="mt-4 flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded-[--bo] bg-khay-sau"
            style={{ width: `${88 - i * 17}%`, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
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
  const soVN = (n: number) => n.toFixed(2).replace(".", ",");
  return (
    <section className="rounded-[--bo-lon] bg-khay/70 px-5 py-5">
      <h2 className="text-base font-semibold">Không tìm thấy trong bộ tài liệu</h2>
      <p className="mt-2 text-sm leading-relaxed text-nhan">
        Đã tìm trong {soVanBan} văn bản. Đoạn gần nhất chỉ đạt {soVN(topScore)}, dưới
        ngưỡng tin cậy {soVN(nguong)} — chưa đủ căn cứ để trích dẫn, nên hệ thống không
        đưa ra câu trả lời.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-nhan">
        Thử hỏi lại bằng từ ngữ có trong văn bản, hoặc nêu rõ số hiệu văn bản cần tra.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export interface TrangThaiLoiProps {
  onThuLai?: () => void;
}

/** Hạ tầng hỏng. Nói thẳng chuyện gì đã xảy ra, không xin lỗi. */
export function TrangThaiLoi({ onThuLai }: TrangThaiLoiProps) {
  return (
    <section className="rounded-[--bo-lon] bg-khay/70 px-5 py-5">
      <h2 className="text-base font-semibold">Không gửi được câu hỏi</h2>
      <p className="mt-2 text-sm leading-relaxed text-nhan">
        Máy chủ tra cứu không phản hồi. Câu hỏi của bạn chưa được xử lý và không có gì
        bị mất.
      </p>
      {onThuLai ? (
        <button
          type="button"
          onClick={onThuLai}
          className={cn(
            "mt-4 rounded-[--bo] bg-but-xanh px-3.5 py-2 text-sm font-medium text-giay",
            "transition-colors duration-[--nhip] hover:bg-but-xanh-sau",
          )}
        >
          Tra cứu lại
        </button>
      ) : null}
    </section>
  );
}
