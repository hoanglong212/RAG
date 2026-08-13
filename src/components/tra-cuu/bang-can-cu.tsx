"use client";

/**
 * BẢNG CĂN CỨ — nguồn truy hồi, gom theo văn bản.
 *
 * Bản cũ đổ ra một danh sách phẳng tám thẻ giống hệt nhau. Ba thẻ đầu cùng là
 * 281/2026/NĐ-CP nên số hiệu ấy lặp lại ba lần liên tiếp; năm thẻ sau thuộc
 * năm văn bản chẳng liên quan (bảo vệ người tiêu dùng, an toàn thực phẩm) mà
 * vẫn chiếm chỗ ngang hàng. Mỗi thẻ gắn một con số trần như "0,56" — số đó nói
 * gì với người tra cứu thì không ai trả lời được.
 *
 * Hai thay đổi về bản chất:
 *
 * 1. GOM THEO VĂN BẢN. Một văn bản một khối, các Điều/Khoản trúng nằm bên
 *    trong. Số hiệu xuất hiện đúng một lần.
 *
 * 2. CHIA THEO "CÂU TRẢ LỜI CÓ DẪN KHÔNG", không chia theo điểm. Đây mới là
 *    thứ người dùng cần biết, và nó là sự thật đo được chứ không phải ngưỡng
 *    tự đặt: chạy bộ dò neo trên chính câu trả lời rồi xem Khoản nào thật sự
 *    được viện dẫn. Phần còn lại không phải "nguồn" — chúng là thứ bộ truy hồi
 *    đã xét và câu trả lời không dùng. Nói đúng như vậy, và xếp gọn lại.
 *
 * Điểm truy hồi vẫn hiện, vì người dùng có quyền biết hệ thống tự tin tới đâu.
 * Nhưng nó đi kèm một vạch so sánh tương đối với nguồn cao nhất, để con số có
 * chỗ dựa thay vì lơ lửng.
 */

import type { Citation } from "@/types/contract";
import { ConDau } from "@/components/kit/con-dau";
import { chiDieuKhoan, loaiVanBan } from "./neo-trich-dan";
import { cn } from "@/lib/utils";

export interface BangCanCuProps {
  citations: Citation[];
  /** Số hiệu các VĂN BẢN mà câu trả lời thật sự viện dẫn. */
  soHieuDaDan: Set<string>;
  chunkIdDangChon?: string | null;
  onChon: (td: Citation, so: number) => void;
}

interface NguonCoSo {
  td: Citation;
  so: number;
}

export function BangCanCu({
  citations,
  soHieuDaDan,
  chunkIdDangChon,
  onChon,
}: BangCanCuProps) {
  if (citations.length === 0) return null;

  const tatCa: NguonCoSo[] = citations.map((td, i) => ({ td, so: i + 1 }));
  const diemCaoNhat = Math.max(...citations.map((c) => c.score), 0.0001);

  /*
   * Chia theo VĂN BẢN chứ không theo từng Khoản được nêu đích danh.
   *
   * Thử cách kia trước và nó sai ở chỗ nhìn thấy được: câu chốt "có hiệu lực
   * từ ngày 31 tháng 8 năm 2026" lấy từ Điều 10, nhưng mô hình nêu ngày mà
   * không nêu số Điều — nên chính cái Khoản chống lưng cho câu quan trọng nhất
   * lại bị xếp vào phần gộp. Một khi câu trả lời đã dựa vào một văn bản thì
   * mọi Điều/Khoản truy hồi được của văn bản ấy đều là căn cứ để đối chiếu.
   *
   * Chưa dò được gì (chữ chưa chảy xong) thì lấy văn bản của nguồn cao điểm
   * nhất, để mục chính không rỗng trong khi rõ ràng đã có nguồn tốt.
   */
  const nhanDien =
    soHieuDaDan.size > 0
      ? soHieuDaDan
      : new Set([tatCa.reduce((a, b) => (b.td.score > a.td.score ? b : a)).td.soHieu]);

  const daDan = tatCa.filter((n) => nhanDien.has(n.td.soHieu));
  const conLai = tatCa.filter((n) => !nhanDien.has(n.td.soHieu));

  const soDieuKhoan = daDan.length;
  const soVanBan = new Set(daDan.map((n) => n.td.soHieu)).size;

  return (
    <section aria-label="Căn cứ">
      <h2 className="nhan-hoa mb-2.5">
        Căn cứ
        {soDieuKhoan > 0 ? (
          <span className="ml-2 font-normal normal-case tracking-normal">
            {soDieuKhoan} điều khoản trong {soVanBan} văn bản
          </span>
        ) : null}
      </h2>

      <div className="flex flex-col gap-2.5">
        {gomTheoVanBan(daDan).map(([soHieu, nhom]) => (
          <KhoiVanBan
            key={soHieu}
            soHieu={soHieu}
            nhom={nhom}
            diemCaoNhat={diemCaoNhat}
            chunkIdDangChon={chunkIdDangChon}
            onChon={onChon}
          />
        ))}
      </div>

      {conLai.length > 0 ? (
        <details className="group mt-3">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center gap-2 rounded-[--bo] py-1.5",
              "text-[0.8125rem] text-nhan transition-colors duration-[--nhip] hover:text-but-xanh",
            )}
          >
            <span
              aria-hidden
              className="inline-block transition-transform duration-[--nhip] group-open:rotate-90"
            >
              ▸
            </span>
            {conLai.length} nguồn thuộc văn bản khác, câu trả lời không dùng tới
          </summary>
          <div className="mt-2 flex flex-col gap-2.5 opacity-75">
            {gomTheoVanBan(conLai).map(([soHieu, nhom]) => (
              <KhoiVanBan
                key={soHieu}
                soHieu={soHieu}
                nhom={nhom}
                diemCaoNhat={diemCaoNhat}
                chunkIdDangChon={chunkIdDangChon}
                onChon={onChon}
              />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

/** Giữ nguyên thứ tự xuất hiện đầu tiên của mỗi văn bản. */
function gomTheoVanBan(ds: NguonCoSo[]): Array<[string, NguonCoSo[]]> {
  const map = new Map<string, NguonCoSo[]>();
  for (const n of ds) {
    const co = map.get(n.td.soHieu);
    if (co) co.push(n);
    else map.set(n.td.soHieu, [n]);
  }
  return [...map.entries()];
}

function KhoiVanBan({
  soHieu,
  nhom,
  diemCaoNhat,
  chunkIdDangChon,
  onChon,
}: {
  soHieu: string;
  nhom: NguonCoSo[];
  diemCaoNhat: number;
  chunkIdDangChon?: string | null;
  onChon: (td: Citation, so: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[--bo-lon] bg-giay shadow-the">
      <div className="flex items-baseline gap-2 bg-khay-sau px-3.5 py-2">
        <span className="so-hieu truncate font-semibold text-muc-in">{soHieu}</span>
        {/* Loại suy từ đuôi số hiệu, không lấy từ breadcrumb — breadcrumb đang
            gắn nhãn sai, gọi NĐ-CP là "Nghị quyết" và TT-BCT là "Nghị định".

            --muc-mo chứ không phải --nhan: trên nền --khay-sau, --nhan chỉ đo
            được 4,54:1, vừa đủ qua AA mà không còn biên nào cho chữ 13px.
            --muc-mo cho 7,53:1; thứ bậc so với số hiệu vẫn giữ bằng cân chữ. */}
        <span className="ml-auto shrink-0 text-[0.8125rem] text-muc-mo">{loaiVanBan(soHieu)}</span>
      </div>

      <ul>
        {nhom.map(({ td, so }, i) => {
          const dangChon = chunkIdDangChon === td.chunkId;
          return (
            <li key={td.chunkId}>
              <button
                type="button"
                onClick={() => onChon(td, so)}
                aria-current={dangChon ? "true" : undefined}
                className={cn(
                  "flex w-full gap-2.5 px-3.5 py-2.5 text-left transition-colors duration-[--nhip]",
                  i > 0 && "border-t border-ke-mo",
                  dangChon ? "bg-neo-vang" : "hover:bg-khay",
                )}
              >
                <ConDau co={22} soThuTu={so} dangDong={dangChon} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate font-medium text-muc-in">
                      {chiDieuKhoan(td.breadcrumb)}
                    </span>
                    <VachDiem score={td.score} diemCaoNhat={diemCaoNhat} />
                  </span>
                  <span className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-nhan">
                    {td.trichDoan}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Điểm truy hồi kèm vạch so sánh với nguồn cao nhất của lần tra cứu này.
 * Con số một mình không có thang: "0,42" là cao hay thấp? Vạch trả lời được.
 */
function VachDiem({ score, diemCaoNhat }: { score: number; diemCaoNhat: number }) {
  const tiLe = Math.max(0.06, Math.min(1, score / diemCaoNhat));
  return (
    <span
      className="ml-auto flex shrink-0 items-center gap-1.5"
      title={`Điểm truy hồi ${score.toFixed(3)} · cao nhất lần này ${diemCaoNhat.toFixed(3)}`}
    >
      <span aria-hidden className="h-1 w-9 overflow-hidden rounded-full bg-khay-sau">
        <span
          className="block h-full rounded-full bg-but-xanh/55"
          style={{ width: `${tiLe * 100}%` }}
        />
      </span>
      <span className="so-hieu text-nhan">{score.toFixed(2).replace(".", ",")}</span>
    </span>
  );
}
