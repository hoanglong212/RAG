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
import { ArrowUpRight, BookOpenCheck, Layers3, Quote } from "lucide-react";
import type { ResearchProgress } from "@/types/research";

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
    <section className="mo-man hien-len rounded-[--bo-lon] px-5 py-7 text-giay shadow-noi sm:px-8 sm:py-9">
      {/*
        Con dấu ở đây KHÔNG phá kỷ luật màu: nó đứng cạnh đúng lời hứa về
        trích dẫn, mà lời hứa đó chính là nghĩa của màu đỏ trong sản phẩm này.
      */}
      <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:items-end">
        <div>
          <ConDau co={56} className="mb-6 block" />
          <h2 className="chu-trung-bay co-trung-bay max-w-2xl">
            Hỏi một câu.
            <br />
            Nhận về đúng Điều.
          </h2>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-giay/70">
            Mỗi câu trả lời đều đóng dấu về Điều, Khoản trong văn bản gốc để bạn tự kiểm
            chứng. Không đủ căn cứ thì hệ thống nói thẳng là không tìm thấy, chứ không đoán.
          </p>
        </div>

        <div className="border-l border-giay/15 pl-5 sm:pl-6">
          <Quote className="size-6 text-giay/35" strokeWidth={1.5} />
          <p className="mt-4 text-sm font-medium leading-relaxed text-giay/85">
            Từ câu hỏi đời thường tới đúng căn cứ pháp lý, trong cùng một mặt đọc.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-giay/75">
            Nguồn xuất hiện trước. Lời giải thích theo sau. Bạn luôn biết hệ thống đang dựa vào đâu.
          </p>
        </div>
      </div>

      {/* Số đo kho tài liệu: bằng chứng lời hứa trên có thật. */}
      {coSo ? (
        <dl className="relative z-10 mt-9 grid gap-3 border-y border-giay/15 py-4 sm:grid-cols-3">
          <div>
            <dt className="nhan-hoa-sang flex items-center gap-2">
              <BookOpenCheck className="size-3.5" />
              Văn bản trong kho
            </dt>
            <dd className="chu-trung-bay co-so-lieu mt-2 font-ma tabular-nums">
              {soNhom(tongVanBan)}
            </dd>
          </div>
          {typeof tongChunk === "number" && tongChunk > 0 ? (
            <div>
              <dt className="nhan-hoa-sang flex items-center gap-2">
                <Layers3 className="size-3.5" />
                Đoạn đã bóc tách
              </dt>
              <dd className="chu-trung-bay co-so-lieu mt-2 font-ma tabular-nums">
                {soNhom(tongChunk)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="nhan-hoa-sang">Độ sâu trích dẫn</dt>
            <dd className="chu-trung-bay co-so-lieu mt-2">Tới Khoản</dd>
          </div>
        </dl>
      ) : null}

      <p className="nhan-hoa-sang relative z-10 mt-8">Thử một câu</p>
      <ul className="relative z-10 mt-3 grid gap-2 lg:grid-cols-3">
        {/*
          Không đánh số 01/02/03: thứ tự ba câu gợi ý không mang thông tin nào,
          nên con số chỉ là trang trí giả vờ có hệ thống.
        */}
        {cauHoiGoiY.map((cau) => (
          <li key={cau}>
            <button
              type="button"
              onClick={() => onChonCauHoi(cau)}
              className={cn(
                "group flex h-full w-full items-start gap-3.5 rounded-[--bo-lon] bg-giay/[0.075] py-4 pl-4 pr-3.5",
                "text-left text-sm leading-relaxed text-giay ring-1 ring-giay/10",
                "transition-[box-shadow,transform] duration-[--nhip]",
                "hover:-translate-y-1 hover:bg-giay/[0.12] hover:shadow-vua",
              )}
            >
              <span className="flex-1">{cau}</span>
              <ArrowUpRight aria-hidden className="mt-0.5 size-4 shrink-0 text-giay/40 transition-[transform,color] duration-[--nhip] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-giay" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Đang tra cứu. Thứ tự các dòng phản ánh đúng thứ tự sự kiện của /api/chat:
 * nguồn về trước, câu trả lời chảy ra sau.
 */
export function DangTai({
  researchMode = false,
  progress,
}: {
  researchMode?: boolean;
  progress?: ResearchProgress | null;
}) {
  const stages: ResearchProgress["stage"][] = ["corpus", "web", "cross_check", "synthesis"];
  const labels = ["Kho nội bộ", "Nguồn web", "Đối chiếu", "Tổng hợp"];
  const current = progress ? stages.indexOf(progress.stage) : 0;
  return (
    <div className="flex flex-col gap-6" role="status" aria-live="polite">
      <section>
        <p className="nhan-hoa mb-2.5">{progress?.label ?? "Đang tìm trong kho văn bản…"}</p>
        {researchMode ? (
          <ol className="mb-4 grid grid-cols-4 gap-1.5" aria-label="Tiến trình nghiên cứu">
            {labels.map((label, index) => (
              <li key={label} className="min-w-0">
                <span className={cn("block h-1 rounded-full", index <= current ? "bg-but-xanh" : "bg-khay-sau")} />
                {/* 10px là quá nhỏ cho tiếng Việt: dấu hai tầng của `ế ộ ữ`
                    nhoè hẳn ở cỡ đó. Dùng bậc nhỏ nhất còn đọc được. */}
                <span
                  className={cn(
                    "mt-1.5 block truncate text-xs font-medium",
                    index <= current ? "text-muc-in" : "text-nhan",
                  )}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
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
export function KhongTimThay({
  topScore,
  nguong,
  soVanBan,
  researchMode = false,
}: KhongTimThayProps & { researchMode?: boolean }) {
  const tyLe = nguong > 0 ? Math.min(100, (topScore / nguong) * 100) : 0;

  return (
    <The className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Không tìm thấy trong bộ tài liệu</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-nhan">
          {researchMode ? (
            "Đã đối chiếu kho nội bộ và các nguồn pháp luật được phép trên web nhưng chưa thu được đủ căn cứ có thể kiểm chứng. Hệ thống không dùng kiến thức ghi nhớ để đoán câu trả lời."
          ) : (
            <>{soVanBan > 0 ? `Đã tìm trong ${soVanBan} văn bản. ` : ""}
            Đoạn gần nhất chỉ đạt {soVN(topScore)}, dưới ngưỡng tin cậy {soVN(nguong)} — chưa
            đủ căn cứ để trích dẫn, nên hệ thống không đưa ra câu trả lời.</>
          )}
        </p>
      </div>

      {/* Khoảng cách tới ngưỡng, hiện thành hình để thấy còn thiếu bao nhiêu. */}
      {!researchMode ? <div className="flex items-center gap-3">
        <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-khay-sau">
          <span
            className="block h-full rounded-full bg-nhan/60"
            style={{ width: `${Math.max(2, tyLe)}%` }}
          />
        </span>
        <span className="so-hieu shrink-0 text-xs tabular-nums text-nhan">
          {soVN(topScore)} / {soVN(nguong)}
        </span>
      </div> : null}

      <p className="text-sm leading-relaxed text-nhan">
        Thử hỏi lại bằng từ ngữ có trong văn bản, hoặc nêu rõ số hiệu văn bản cần tra.
      </p>
    </The>
  );
}

/* ------------------------------------------------------------------ */

export interface TrangThaiLoiProps {
  onThuLai?: () => void;
  message?: string;
}

/** Hạ tầng hỏng. Nói thẳng chuyện gì đã xảy ra, không xin lỗi. */
export function TrangThaiLoi({ onThuLai, message }: TrangThaiLoiProps) {
  return (
    <div
      role="alert"
      className="rounded-[--bo-lon] bg-khay-sau px-4 py-4 shadow-the"
    >
      <h2 className="text-base font-semibold">Không gửi được câu hỏi</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-nhan">
        {message ?? "Máy chủ tra cứu không phản hồi. Câu hỏi của bạn chưa được xử lý và không có gì bị mất."}
      </p>
      {onThuLai ? (
        <Nut kieu="phu" className="mt-3.5" onClick={onThuLai}>
          Tra cứu lại
        </Nut>
      ) : null}
    </div>
  );
}
