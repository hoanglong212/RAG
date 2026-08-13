"use client";

/**
 * Bản phân tích tình huống — thay cho khối văn xuôi cũ.
 *
 * Thứ tự trên màn hình là thứ tự người đọc cần: kết luận trước, rồi mức độ
 * tin được tới đâu, rồi diễn biến dẫn tới kết luận đó, rồi việc phải làm.
 * Khối chữ cũ đặt "có thể liên quan" lên đầu và chôn phần hành động xuống
 * cuối, nên đọc xong vẫn không biết làm gì.
 *
 * Con dấu đỏ chỉ xuất hiện ở mốc thời gian NEO ĐƯỢC vào một đoạn trích thật.
 * Mốc không có căn cứ thì không có dấu — đúng kỷ luật màu của sản phẩm, và ở
 * đây nó gánh thêm một việc: cho thấy phần nào của lập luận có văn bản chống
 * lưng, phần nào chỉ là thuật lại lời kể.
 */

import type { Citation } from "@/types/contract";
import type { PhanTichTinhHuong as DuLieuPhanTich } from "@/lib/legal/check";
import { ConDau } from "@/components/kit/con-dau";
import { The, TieuDeMuc } from "@/components/kit/co-ban";
import { cn } from "@/lib/utils";

const NHAN_CHAC_CHAN: Record<DuLieuPhanTich["mucDoChacChan"], string> = {
  cao: "Căn cứ vững",
  trung_binh: "Căn cứ vừa phải",
  thap: "Căn cứ mỏng",
};

function DanhSach({
  tieuDe,
  phu,
  cacMuc,
  danhSo = false,
}: {
  tieuDe: string;
  phu?: string;
  cacMuc: string[];
  danhSo?: boolean;
}) {
  if (cacMuc.length === 0) return null;
  const Bao = danhSo ? "ol" : "ul";
  return (
    <section>
      <TieuDeMuc phu={phu}>{tieuDe}</TieuDeMuc>
      <Bao className="mt-2.5 flex flex-col gap-2">
        {cacMuc.map((m, i) => (
          <li key={m} className="flex gap-3 text-sm leading-relaxed">
            {danhSo ? (
              // Ở đây thứ tự MANG thông tin: làm việc 2 trước việc 1 thì hỏng.
              <span className="so-hieu shrink-0 text-nhan">{i + 1}</span>
            ) : (
              <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-nhan" />
            )}
            <span>{m}</span>
          </li>
        ))}
      </Bao>
    </section>
  );
}

export function PhanTichTinhHuong({
  phanTich,
  citations,
  onMoCanCu,
}: {
  phanTich: DuLieuPhanTich;
  citations: Citation[];
  onMoCanCu?: (trichDan: Citation) => void;
}) {
  return (
    <The className="flex flex-col gap-7">
      {/* ---------- Kết luận ---------- */}
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="nhan-hoa">Kết luận</p>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              phanTich.mucDoChacChan === "cao"
                ? "bg-but-xanh text-giay"
                : phanTich.mucDoChacChan === "trung_binh"
                  ? "bg-but-xanh-nhat text-but-xanh"
                  : "bg-khay-sau text-nhan",
            )}
          >
            {NHAN_CHAC_CHAN[phanTich.mucDoChacChan]}
          </span>
        </div>
        {/* Kết luận là câu duy nhất người dùng tới đây để đọc — dùng bậc
            số liệu của thang chữ, không chế thêm cỡ riêng. */}
        <p className="chu-trung-bay co-so-lieu mt-2.5">{phanTich.ketLuan}</p>
        {phanTich.lyDoChacChan ? (
          <p className="mt-2.5 text-sm leading-relaxed text-nhan">{phanTich.lyDoChacChan}</p>
        ) : null}
      </div>

      {/* ---------- Cảnh báo ngoài phạm vi ---------- */}
      {phanTich.ngoaiPhamVi ? (
        <div className="rounded-[--bo] bg-khay-sau px-4 py-3.5">
          <p className="text-sm font-semibold">Kho văn bản chưa phủ hết quan hệ này</p>
          <p className="mt-1.5 text-sm leading-relaxed text-nhan">{phanTich.ngoaiPhamVi}</p>
        </div>
      ) : null}

      {/* ---------- Diễn biến ---------- */}
      {phanTich.dongThoiGian.length > 0 ? (
        <section>
          <TieuDeMuc phu="Mốc có con dấu là mốc neo được vào văn bản trong kho">
            Diễn biến và hệ quả
          </TieuDeMuc>

          <ol className="mt-3.5">
            {phanTich.dongThoiGian.map((moc, i) => {
              const cuoi = i === phanTich.dongThoiGian.length - 1;
              const canCu = moc.danChung
                .map((n) => citations[n - 1])
                .filter((c): c is Citation => Boolean(c));
              return (
                <li key={`${moc.moc}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
                  {/* Sợi dọc nối các mốc, dừng ở mốc cuối. */}
                  {!cuoi ? (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-[5px] top-6 w-px bg-ke-mo"
                    />
                  ) : null}
                  <span
                    aria-hidden
                    className={cn(
                      "relative z-10 mt-[7px] size-2.5 shrink-0 rounded-full",
                      canCu.length > 0 ? "bg-dau-do" : "bg-nhan/50",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="so-hieu text-muc-in">{moc.moc}</p>
                    <p className="mt-1 text-sm font-medium leading-relaxed">{moc.suKien}</p>
                    {moc.heQua ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-nhan">{moc.heQua}</p>
                    ) : null}

                    {canCu.length > 0 ? (
                      <ul className="mt-2.5 flex flex-wrap gap-1.5">
                        {canCu.map((c, j) => (
                          <li key={c.chunkId}>
                            <button
                              type="button"
                              onClick={() => onMoCanCu?.(c)}
                              title={`${c.soHieu} — ${c.breadcrumb}`}
                              className="flex items-center gap-1.5 rounded-[--bo] bg-khay px-2 py-1 transition-colors duration-[--nhip] hover:bg-khay-sau"
                            >
                              <ConDau co={16} soThuTu={moc.danChung[j]} />
                              <span className="so-hieu text-xs text-nhan">{c.soHieu}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <DanhSach
        tieuDe="Việc cần làm"
        phu="Theo thứ tự"
        cacMuc={phanTich.viecCanLam}
        danhSo
      />
      <DanhSach
        tieuDe="Chứng cứ cần giữ"
        phu="Thiếu những thứ này thì lập luận ở trên khó đứng"
        cacMuc={phanTich.chungCuCanGiu}
      />
      <DanhSach
        tieuDe="Điểm bất lợi"
        phu="Phía bên kia nhiều khả năng sẽ dựa vào đây"
        cacMuc={phanTich.diemYeu}
      />
    </The>
  );
}
