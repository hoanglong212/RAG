/**
 * Biểu đồ cột. Dựng bằng HTML thuần, không kéo thư viện vẽ.
 *
 * VÌ SAO MỘT MÀU DUY NHẤT: kỷ luật màu của dự án chỉ có một điểm nhấn
 * (--but-xanh), còn --dau-do thì dành riêng cho neo trích dẫn. May thay đó
 * cũng là cách vẽ đúng: độ lớn ở đây đã được mã hoá bằng CHIỀU DÀI cột, nên
 * tô thêm màu theo thứ hạng là mã hoá thừa và sẽ đổi màu khi lọc lại dữ liệu.
 * Cần so nhiều đại lượng thì tách thành nhiều biểu đồ nhỏ cùng dạng, không
 * chồng ba màu vào một khung.
 *
 * Quy cách vạch: đầu mút bo 4px, chân cột vuông để bám trục; hai cột cách nhau
 * bằng nền chứ không bằng viền; lưới và trục lùi hẳn về sau.
 */

import { cn } from "@/lib/utils";

export interface MucCot {
  nhan: string;
  giaTri: number;
  /** Chuỗi hiển thị, mặc định là giaTri. */
  hienThi?: string;
}

/**
 * Cột ngang — dùng khi nhãn là chữ tiếng Việt dài (tên cơ quan, loại văn bản).
 * Cột ngang cho nhãn cả dòng để đọc, cột dọc thì phải xoay chữ và dấu tiếng
 * Việt xoay 90° gần như không đọc được.
 */
export function CotNgang({
  cacMuc,
  donVi = "",
  toiDaHien,
}: {
  cacMuc: MucCot[];
  donVi?: string;
  toiDaHien?: number;
}) {
  const hien = toiDaHien ? cacMuc.slice(0, toiDaHien) : cacMuc;
  const dinh = Math.max(1, ...hien.map((m) => m.giaTri));

  if (hien.length === 0) {
    return <p className="text-sm text-nhan">Chưa có dữ liệu.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {hien.map((m) => {
        const phanTram = Math.max(1.5, (m.giaTri / dinh) * 100);
        return (
          <li key={m.nhan} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
            <span className="truncate text-[0.8125rem] leading-relaxed" title={m.nhan}>
              {m.nhan}
            </span>
            <span className="so-hieu text-right text-[0.8125rem] tabular-nums text-nhan">
              {m.hienThi ?? m.giaTri}
              {donVi}
            </span>
            <span
              aria-hidden
              className="col-span-2 mt-1 block h-1.5 rounded-l-[1px] bg-khay-sau"
            >
              <span
                className="block h-full rounded-r-[4px] bg-but-xanh transition-[width] duration-[--nhip-cham]"
                style={{ width: `${phanTram}%` }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Cột dọc — dùng cho chuỗi theo thời gian, nơi trục ngang là năm và nhãn ngắn.
 */
export function CotDoc({ cacMuc, donVi = "" }: { cacMuc: MucCot[]; donVi?: string }) {
  const dinh = Math.max(1, ...cacMuc.map((m) => m.giaTri));

  if (cacMuc.length === 0) {
    return <p className="text-sm text-nhan">Chưa có dữ liệu.</p>;
  }

  return (
    <div className="flex items-end gap-1.5" style={{ height: "9rem" }}>
      {cacMuc.map((m) => (
        <div key={m.nhan} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="so-hieu text-[0.6875rem] tabular-nums text-nhan">
            {m.hienThi ?? m.giaTri}
          </span>
          <span
            title={`${m.nhan}: ${m.hienThi ?? m.giaTri}${donVi}`}
            className="block w-full rounded-t-[4px] bg-but-xanh transition-[height] duration-[--nhip-cham]"
            style={{ height: `${Math.max(2, (m.giaTri / dinh) * 100)}%` }}
          />
          <span className="so-hieu truncate text-[0.6875rem] text-nhan">{m.nhan}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Biểu đồ chính của trang — chỗ mắt rơi vào trước.
 *
 * Một đại lượng, một màu, và một đường chuẩn kẻ đứt ngang ở mức của lần chạy
 * đầu tiên. Đường chuẩn đó mới là thứ làm biểu đồ có nghĩa: nó biến bốn cây
 * cột rời rạc thành một câu chuyện "đổi cái này thì được thêm chừng này".
 */
export function CotDocLon({
  cacMuc,
  dinhTruc = 1,
  dinhDang = (v: number) => `${Math.round(v * 100)}%`,
}: {
  cacMuc: MucCot[];
  dinhTruc?: number;
  dinhDang?: (v: number) => string;
}) {
  if (cacMuc.length === 0) {
    return <p className="text-sm text-nhan">Chưa có lần chạy nào.</p>;
  }
  const chuan = cacMuc[0].giaTri;
  const caoChuan = (chuan / dinhTruc) * 100;

  return (
    <div>
      <div className="relative flex items-end gap-2.5" style={{ height: "13rem" }}>
        {/* Đường chuẩn: kẻ đứt, lùi hẳn về sau, nhãn nằm ngoài vùng cột. */}
        <span
          aria-hidden
          className="absolute inset-x-0 border-t border-dashed border-muc-in/25"
          style={{ bottom: `${caoChuan}%` }}
        />
        {cacMuc.map((m, i) => {
          const cao = Math.max(3, (m.giaTri / dinhTruc) * 100);
          const honChuan = i > 0 && m.giaTri > chuan;
          return (
            <div
              key={m.nhan}
              className="group relative flex min-w-0 flex-1 flex-col justify-end"
              style={{ height: "100%" }}
              title={`${m.nhan}: ${dinhDang(m.giaTri)}`}
            >
              <span
                className={cn(
                  "so-hieu mb-1.5 text-center text-[0.8125rem] tabular-nums",
                  honChuan ? "font-medium text-muc-in" : "text-nhan",
                )}
              >
                {m.hienThi ?? dinhDang(m.giaTri)}
              </span>
              {/* Chặn bề ngang: ít cột mà để giãn hết khung thì thành khối đặc,
                  không còn đọc ra là biểu đồ nữa. */}
              <span
                className="mx-auto block w-full max-w-[5.5rem] rounded-t-[4px] bg-but-xanh transition-[height,background-color] duration-[--nhip-cham] group-hover:bg-but-xanh-sau"
                style={{ height: `${cao}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex gap-2.5 border-t border-ke-mo pt-2.5">
        {cacMuc.map((m) => (
          <span
            key={m.nhan}
            className="so-hieu min-w-0 flex-1 truncate text-center text-nhan"
            title={m.nhan}
          >
            {m.nhan}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Biểu đồ nhỏ trong bộ nhiều biểu đồ cùng dạng. Mỗi cái đúng MỘT đại lượng —
 * đây là cách so ba chỉ số eval mà không phải nhét ba màu vào một khung, và
 * cũng tránh được lỗi hai trục tung.
 */
export function BieuDoNho({
  tieuDe,
  cacMuc,
  dinhTruc = 1,
  dinhDang = (v: number) => v.toFixed(2).replace(".", ","),
  className,
}: {
  tieuDe: string;
  cacMuc: MucCot[];
  /** Trục cố định để các biểu đồ trong cùng bộ so được với nhau. */
  dinhTruc?: number;
  dinhDang?: (v: number) => string;
  className?: string;
}) {
  const cuoi = cacMuc.at(-1);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="nhan-hoa">{tieuDe}</p>
        {cuoi ? (
          <p className="so-hieu text-sm tabular-nums text-muc-in">{dinhDang(cuoi.giaTri)}</p>
        ) : null}
      </div>
      <div className="flex items-end gap-1" style={{ height: "4.5rem" }}>
        {cacMuc.map((m) => (
          <div key={m.nhan} className="flex min-w-0 flex-1 justify-center">
            <span
              title={`${m.nhan}: ${dinhDang(m.giaTri)}`}
              className="block w-full rounded-t-[4px] bg-but-xanh"
              style={{ height: `${Math.max(2, (m.giaTri / dinhTruc) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {cacMuc.map((m) => (
          <span
            key={m.nhan}
            className="min-w-0 flex-1 truncate text-center text-[0.625rem] text-nhan"
            title={m.nhan}
          >
            {m.nhan}
          </span>
        ))}
      </div>
    </div>
  );
}
