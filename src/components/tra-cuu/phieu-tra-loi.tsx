"use client";

/**
 * PHIẾU TRẢ LỜI — thứ người dùng đến đây để lấy, đặt ở vị trí đầu tiên.
 *
 * Bố cục cũ xếp Nguồn (8) lên trên rồi mới tới Trả lời. Lý do khi đó là "đúng
 * thứ tự chúng về" — giữ được khoảnh khắc trích dẫn tới trước câu trả lời. Cái
 * giá phải trả lộ ra ngay ở lần đọc đầu: phải cuộn qua một màn rưỡi trích đoạn
 * luật thô mới thấy câu trả lời. Tối ưu cho hai giây hoạt ảnh, đánh đổi bằng
 * mọi lần đọc sau đó.
 *
 * Khoảnh khắc chữ ký không cần Nguồn nằm trên. Nó cần Ô NÀY, ở vị trí này,
 * hiện các con dấu đang đóng xuống trong lúc chờ chữ đầu tiên — rồi biến thành
 * câu trả lời ngay tại chỗ. Xem TrongLucDung bên dưới.
 *
 * VẬT LIỆU: phiếu nằm trên --giay. Trong ẩn dụ ba tầng bàn/khay/giấy, đây là
 * tờ giấy được đưa cho người dùng; căn cứ bên dưới nằm trên --khay vì chúng là
 * dụng cụ đối chiếu. Chỉ riêng việc đổi nền đã nói được "cái nào là câu trả
 * lời" mà không cần một chữ nhãn nào.
 */

import { docCauTraLoi, tachDieuKienHeQua, type KhoiTraLoi } from "./doc-cau-tra-loi";
import { ChuCoNeo } from "./chu-co-neo";
import type { NguonDeNeo } from "./neo-trich-dan";
import { ConDau } from "@/components/kit/con-dau";
import { cn } from "@/lib/utils";

export interface PhieuTraLoiProps {
  noiDung: string;
  nguon: NguonDeNeo[];
  /** Số thứ tự 1-based của nguồn đang mở ở mặt đọc. */
  soDangChon?: number;
  onChonSo?: (so: number) => void;
  dangViet?: boolean;
}

/** Con trỏ nhấp nháy ở cuối dòng đang chảy. */
function ConTro() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse bg-muc-in/60"
    />
  );
}

export function PhieuTraLoi({
  noiDung,
  nguon,
  soDangChon,
  onChonSo,
  dangViet = false,
}: PhieuTraLoiProps) {
  const khoi = docCauTraLoi(noiDung);
  const cuoiCung = khoi.length - 1;

  return (
    <article className="rounded-[--bo-lon] bg-giay px-5 py-5 shadow-vua sm:px-8 sm:py-7">
      <header className="mb-4 flex items-center gap-2 border-b border-ke-mo pb-3">
        <ConDau co={18} />
        <h2 className="nhan-hoa">Trả lời</h2>
        {dangViet ? (
          <span className="nhan-hoa ml-auto text-but-xanh">Đang soạn</span>
        ) : (
          <span className="nhan-hoa ml-auto">
            {nguon.length} căn cứ
          </span>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {khoi.map((k, i) => (
          <KhoiDung
            key={i}
            khoi={k}
            nguon={nguon}
            soDangChon={soDangChon}
            onChonSo={onChonSo}
            conTro={dangViet && i === cuoiCung}
          />
        ))}
      </div>
    </article>
  );
}

function KhoiDung({
  khoi,
  nguon,
  soDangChon,
  onChonSo,
  conTro,
}: {
  khoi: KhoiTraLoi;
  nguon: NguonDeNeo[];
  soDangChon?: number;
  onChonSo?: (so: number) => void;
  conTro: boolean;
}) {
  const chung = { nguon, soDangChon, onChonSo };

  if (khoi.loai === "ketLuan") {
    return (
      // Bậc duy nhất được phóng to trong phiếu. Câu chốt phải đọc được từ
      // khoảng cách liếc mắt, phần còn lại là để đọc kỹ.
      <p className="co-ket-luan">
        <ChuCoNeo chu={khoi.chu} nhanManhSoLieu {...chung} />
        {conTro ? <ConTro /> : null}
      </p>
    );
  }

  if (khoi.loai === "tieuDe") {
    return <h3 className="nhan-hoa mt-1 text-muc-mo">{khoi.chu}</h3>;
  }

  if (khoi.loai === "luuY") {
    return (
      <p className="border-t border-ke-mo pt-3 text-[0.8125rem] leading-relaxed text-nhan">
        {khoi.chu}
      </p>
    );
  }

  if (khoi.loai === "doan") {
    return (
      <p className="leading-[--dong-body] text-muc-mo">
        <ChuCoNeo chu={khoi.chu} {...chung} />
        {conTro ? <ConTro /> : null}
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {khoi.muc.map((muc, i) => (
        <li key={i} className="flex gap-3">
          <span
            className={cn(
              "so-hieu mt-[0.2rem] grid size-[1.375rem] shrink-0 place-items-center",
              "rounded-[--bo] bg-khay-sau font-semibold text-muc-mo",
            )}
            aria-hidden
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <MenhDe chu={muc.chu} {...chung} />
            {muc.con.length > 0 ? (
              <ul className="mt-2.5 flex flex-col gap-2 border-l border-ke-mo pl-3.5">
                {muc.con.map((con, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="so-hieu mt-[0.15rem] shrink-0 text-nhan" aria-hidden>
                      {i + 1}
                      {String.fromCharCode(97 + j)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <MenhDe chu={con} {...chung} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {conTro && i === khoi.muc.length - 1 && muc.con.length === 0 ? <ConTro /> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Một mệnh đề "Nếu X thì Y", tách hai vế.
 *
 * Người đọc quét các vế ĐIỀU KIỆN để tìm trường hợp của mình rồi mới đọc vế
 * HỆ QUẢ. In cả hai cùng cân chữ là bắt họ đọc hết mới biết đoạn này có liên
 * quan không. Mũi tên là cái đầu thị giác của vế hệ quả — không phải trang
 * trí, nó thay đúng chữ "thì" đã bị cắt đi.
 */
function MenhDe({
  chu,
  nguon,
  soDangChon,
  onChonSo,
}: {
  chu: string;
  nguon: NguonDeNeo[];
  soDangChon?: number;
  onChonSo?: (so: number) => void;
}) {
  const tach = tachDieuKienHeQua(chu);
  const chung = { nguon, soDangChon, onChonSo };

  // Nhánh con KHÔNG thu nhỏ chữ. Cấp bậc đã do vạch kẻ, thụt lề và nhãn 2a/2b
  // nói rồi; thu nhỏ thêm chỉ làm khó đọc chứ không thêm nghĩa — và một nhánh
  // xử lý con không hề kém quan trọng hơn nhánh cha, nó là trường hợp cụ thể
  // mà người dùng có thể đang rơi đúng vào.
  if (!tach) {
    return (
      <p className="leading-[--dong-body]">
        <ChuCoNeo chu={chu} {...chung} />
      </p>
    );
  }

  return (
    <>
      <p className="leading-[--dong-body] text-muc-mo">
        <ChuCoNeo chu={tach.dieuKien} {...chung} />
      </p>
      <p className="mt-1 flex gap-1.5 font-medium leading-[--dong-body] text-muc-in">
        <span aria-hidden className="shrink-0 select-none text-but-xanh">
          →
        </span>
        <span className="min-w-0">
          <ChuCoNeo chu={tach.heQua} {...chung} />
        </span>
      </p>
    </>
  );
}
