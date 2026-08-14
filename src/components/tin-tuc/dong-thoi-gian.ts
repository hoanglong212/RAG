/**
 * DÒNG THỜI GIAN CỦA TIN — gom theo ngày và đo độ tươi.
 *
 * Vì sao cần: dòng tin cũ đổ ra hai mươi thẻ phẳng, mỗi thẻ ghi "2 ngày trước"
 * ở cỡ chữ nhỏ nhất. Nhìn vào không thể biết kho tin trải mấy ngày, cũng không
 * thấy được là NÓ ĐANG ĐỨNG YÊN. Đo trên máy thật: 152 bài lấy về lúc 16:25
 * ngày 12/08 rồi thôi — tới 14/08 trang vẫn hiển thị bình thường như không có
 * chuyện gì. Không chỗ nào trên màn hình nói ra điều đó.
 *
 * Gom theo ngày làm khoảng trống hiện lên thay vì bị giấu: thiếu ngày 13/08
 * thì cái tiêu đề ngày 13/08 vắng mặt, mắt thấy ngay.
 */

import type { NewsArticleSummary } from "@/types/news";

export interface NhomNgay {
  /** Khóa ổn định: YYYY-MM-DD theo giờ địa phương. */
  khoa: string;
  nhan: string;
  bai: NewsArticleSummary[];
}

/** YYYY-MM-DD theo giờ ĐỊA PHƯƠNG (không dùng toISOString — nó quy về UTC). */
function khoaNgay(d: Date): string {
  const th = `${d.getMonth() + 1}`.padStart(2, "0");
  const ng = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${th}-${ng}`;
}

const THU = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

export function nhanNgay(khoa: string, bayGio = new Date()): string {
  const homNay = khoaNgay(bayGio);
  if (khoa === homNay) return "Hôm nay";

  const homQua = new Date(bayGio);
  homQua.setDate(homQua.getDate() - 1);
  if (khoa === khoaNgay(homQua)) return "Hôm qua";

  const [nam, thang, ngay] = khoa.split("-").map(Number);
  const d = new Date(nam, thang - 1, ngay);
  const cachNgay = Math.round((bayGio.getTime() - d.getTime()) / 86_400_000);
  const nhanNgan = `${`${ngay}`.padStart(2, "0")}/${`${thang}`.padStart(2, "0")}`;
  // Trong tuần thì thứ dễ định vị hơn con số; xa hơn thì phải có năm.
  if (cachNgay < 7) return `${THU[d.getDay()]}, ${nhanNgan}`;
  return cachNgay < 300 ? nhanNgan : `${nhanNgan}/${nam}`;
}

export function gomTheoNgay(
  bai: NewsArticleSummary[],
  bayGio = new Date(),
): NhomNgay[] {
  const map = new Map<string, NewsArticleSummary[]>();
  const khongRo: NewsArticleSummary[] = [];

  for (const b of bai) {
    if (!b.publishedAt) {
      khongRo.push(b);
      continue;
    }
    const d = new Date(b.publishedAt);
    if (Number.isNaN(d.getTime())) {
      khongRo.push(b);
      continue;
    }
    const k = khoaNgay(d);
    const co = map.get(k);
    if (co) co.push(b);
    else map.set(k, [b]);
  }

  const nhom: NhomNgay[] = [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([khoa, ds]) => ({ khoa, nhan: nhanNgay(khoa, bayGio), bai: ds }));

  if (khongRo.length > 0) {
    nhom.push({ khoa: "khong-ro", nhan: "Không rõ thời điểm", bai: khongRo });
  }
  return nhom;
}

/* ------------------------------------------------------------------ */

export type MucDoTuoi = "moi" | "trongNgay" | "cu";

export interface DoTuoi {
  mucDo: MucDoTuoi;
  /** Mô tả sẵn để hiển thị, ví dụ "25 phút trước". */
  moTa: string;
  gio: number | null;
}

/**
 * Ngưỡng 12 giờ, không phải 24.
 *
 * Ba nguồn RSS báo chí đăng liên tục suốt ngày. Nửa ngày không có bài mới nào
 * thì gần như chắc chắn là phía mình không lấy về được, chứ không phải cả ba
 * toà soạn cùng im lặng. Đặt ngưỡng 24 giờ thì một ngày hỏng vẫn trông bình
 * thường — đúng cái đã xảy ra.
 */
const NGUONG_CU_GIO = 12;
const NGUONG_MOI_GIO = 2;

export function doDoTuoi(moiNhatIso: string | null, bayGio = new Date()): DoTuoi {
  if (!moiNhatIso) return { mucDo: "cu", moTa: "chưa có bài nào", gio: null };
  const t = new Date(moiNhatIso).getTime();
  if (Number.isNaN(t)) return { mucDo: "cu", moTa: "không đọc được thời điểm", gio: null };

  const phut = Math.max(0, Math.floor((bayGio.getTime() - t) / 60_000));
  const gio = phut / 60;
  const mucDo: MucDoTuoi =
    gio >= NGUONG_CU_GIO ? "cu" : gio < NGUONG_MOI_GIO ? "moi" : "trongNgay";
  return { mucDo, moTa: moTaKhoangCach(phut), gio };
}

export function moTaKhoangCach(phut: number): string {
  if (phut < 1) return "vừa xong";
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.floor(gio / 24);
  return ngay < 30 ? `${ngay} ngày trước` : `${Math.floor(ngay / 30)} tháng trước`;
}

/** Khoảng cách tính từ một mốc ISO, dùng cho từng bài. */
export function khoangCachTu(iso: string, bayGio = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  return moTaKhoangCach(Math.max(0, Math.floor((bayGio.getTime() - t) / 60_000)));
}
