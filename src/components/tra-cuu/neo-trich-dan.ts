/**
 * NEO TRÍCH DẪN — tìm chỗ trong câu trả lời có thể bấm về văn bản gốc.
 *
 * Nền của việc này: lời nhắc hệ thống yêu cầu mô hình đánh dấu [1] [2] sau mỗi
 * khẳng định, và CauTraLoi được viết để biến những dấu đó thành neo. Nhưng đo
 * trên /api/chat thì mô hình gần như không bao giờ viết [n] cho chế độ tra cứu
 * kho — nó viết theo lối trích dẫn pháp lý thật:
 *
 *     ... tiếp tục thực hiện theo quyết định đã ban hành (điểm a, khoản 2, Điều 11).
 *
 * Nên toàn bộ cơ chế neo — chỗ DUY NHẤT --dau-do được phép vào giữa câu văn —
 * nằm chết. Ở đây nhận cả ba dạng người ta thật sự viết: [n], "khoản 2 Điều 11",
 * và số hiệu văn bản.
 *
 * KỶ LUẬT MÀU: chỉ tô đỏ khi thật sự giải được về một nguồn đã truy hồi. Dẫn
 * chiếu tới văn bản NGOÀI kho (ví dụ "Điều 65 Luật Xử lý vi phạm hành chính")
 * được nhận diện nhưng để màu trung tính — vắng đỏ ở đây mang đúng nghĩa của
 * nó: hệ thống không có bản gốc để đối chiếu.
 */

export interface NguonDeNeo {
  soHieu: string;
  breadcrumb: string;
  score: number;
}

export interface Neo {
  batDau: number;
  ketThuc: number;
  chu: string;
  /** Số thứ tự 1-based của nguồn giải được; 0 nghĩa là không có trong kho. */
  so: number;
  loai: "so" | "dieuKhoan" | "soHieu";
}

/** [1] … [12] theo đúng hợp đồng ban đầu. */
const DAU_SO = /\[(\d{1,2})\]/g;

/** "điểm a, khoản 2, Điều 11" · "khoản 1 Điều 65" · "Điều 10". */
const DIEU_KHOAN =
  /(?:điểm\s+[a-zăâđêôơư]{1,3}\s*,?\s*)?(?:khoản\s+(\d{1,3})\s*,?\s*)?điều\s+(\d{1,3})/gi;

/** "281/2026/NĐ-CP" · "19/2023/QH15" · "47/2010/TT-BCT". */
const SO_HIEU = /\b\d{1,4}\/\d{4}\/[A-ZĐ]{2,}(?:-[A-ZĐ]{2,})*\b/g;

/** "… > Điều 11 > Khoản 2" → { dieu: 11, khoan: 2 }. */
function docBreadcrumb(breadcrumb: string): { dieu: number | null; khoan: number | null } {
  return {
    dieu: Number(breadcrumb.match(/Điều\s+(\d{1,3})/i)?.[1]) || null,
    khoan: Number(breadcrumb.match(/Khoản\s+(\d{1,3})/i)?.[1]) || null,
  };
}

/**
 * Tìm mọi neo trong một đoạn chữ, đã khử chồng lấn và sắp theo vị trí.
 */
export function timNeo(chu: string, nguon: NguonDeNeo[]): Neo[] {
  const thay: Neo[] = [];

  for (const khop of chu.matchAll(DAU_SO)) {
    const so = Number(khop[1]);
    thay.push({
      batDau: khop.index,
      ketThuc: khop.index + khop[0].length,
      chu: khop[0],
      so: so >= 1 && so <= nguon.length ? so : 0,
      loai: "so",
    });
  }

  for (const khop of chu.matchAll(DIEU_KHOAN)) {
    const khoan = khop[1] ? Number(khop[1]) : null;
    const dieu = Number(khop[2]);
    thay.push({
      batDau: khop.index,
      ketThuc: khop.index + khop[0].length,
      chu: khop[0],
      so: giaiDieuKhoan(nguon, dieu, khoan),
      loai: "dieuKhoan",
    });
  }

  for (const khop of chu.matchAll(SO_HIEU)) {
    thay.push({
      batDau: khop.index,
      ketThuc: khop.index + khop[0].length,
      chu: khop[0],
      so: giaiSoHieu(nguon, khop[0]),
      loai: "soHieu",
    });
  }

  thay.sort((a, b) => a.batDau - b.batDau || b.ketThuc - a.ketThuc);
  const giu: Neo[] = [];
  for (const neo of thay) {
    if (giu.length > 0 && neo.batDau < giu[giu.length - 1].ketThuc) continue;
    giu.push(neo);
  }
  return giu;
}

/**
 * Ghép "khoản 2, Điều 11" về một nguồn đã truy hồi.
 *
 * Có Khoản thì phải khớp cả Điều lẫn Khoản — "Điều 11 Khoản 2" và "Điều 11
 * Khoản 3" là hai quy định khác nhau, neo nhầm còn tệ hơn không neo. Không nêu
 * Khoản thì khớp theo Điều, và khi nhiều văn bản cùng có Điều đó thì lấy nguồn
 * điểm cao nhất — cùng một Điều mà không nói rõ văn bản thì câu đang nói về
 * văn bản chính của câu trả lời.
 */
/**
 * Số hiệu chỉ định một VĂN BẢN, không phải một Khoản. Nên neo về đoạn điểm cao
 * nhất của văn bản đó — cửa vào hợp lý nhất — chứ không phải đoạn đầu tiên
 * tình cờ có mặt trong danh sách.
 */
function giaiSoHieu(nguon: NguonDeNeo[], soHieu: string): number {
  let tot = 0;
  let diemTot = -Infinity;
  for (const [i, n] of nguon.entries()) {
    if (n.soHieu !== soHieu || n.score <= diemTot) continue;
    diemTot = n.score;
    tot = i + 1;
  }
  return tot;
}

function giaiDieuKhoan(nguon: NguonDeNeo[], dieu: number, khoan: number | null): number {
  let tot = 0;
  let diemTot = -Infinity;
  for (const [i, n] of nguon.entries()) {
    const { dieu: d, khoan: k } = docBreadcrumb(n.breadcrumb);
    if (d !== dieu) continue;
    if (khoan !== null && k !== khoan) continue;
    if (n.score > diemTot) {
      diemTot = n.score;
      tot = i + 1;
    }
  }
  return tot;
}

/* ------------------------------------------------------------------ */

/**
 * Chỉ giữ phần Điều/Khoản/Điểm của breadcrumb.
 *
 * rutGonDuongDan bỏ Chương và Mục nhưng giữ lại đoạn đầu — tên văn bản. Trong
 * bảng căn cứ đã gom theo văn bản thì đoạn đó thừa: số hiệu đã nằm ở đầu khối,
 * lặp lại ở từng dòng chính là kiểu trùng lặp mà việc gom nhóm sinh ra để dẹp.
 * Tệ hơn, đoạn đó đang mang nhãn sai ("Nghị quyết" cho một Nghị định).
 */
export function chiDieuKhoan(breadcrumb: string): string {
  const phan = breadcrumb
    .split(">")
    .map((s) => s.trim())
    .filter((s) => /^(Điều|Khoản|Điểm)\b/i.test(s));
  return phan.length > 0 ? phan.join(" · ") : breadcrumb.trim();
}

/**
 * Loại văn bản suy từ đuôi số hiệu.
 *
 * Cần vì breadcrumb từ API đang gắn nhãn sai một cách nhìn thấy được:
 * "Nghị quyết 281/2026/NĐ-CP" (NĐ-CP là Nghị định) và "Nghị định
 * 47/2010/TT-BCT" (TT là Thông tư). Đuôi số hiệu là thứ xác định loại văn bản
 * theo Luật Ban hành văn bản quy phạm pháp luật, nên suy ngược từ đó luôn đúng
 * hơn chuỗi có sẵn. Đây là quyết định trình bày, không đụng vào contract.
 */
export function loaiVanBan(soHieu: string): string {
  const duoi = soHieu.split("/").pop()?.toUpperCase() ?? "";
  if (duoi.startsWith("NĐ-CP")) return "Nghị định";
  if (duoi.startsWith("QĐ")) return "Quyết định";
  if (duoi.startsWith("NQ")) return "Nghị quyết";
  if (duoi.startsWith("TT")) return "Thông tư";
  if (duoi.startsWith("CT")) return "Chỉ thị";
  if (duoi.startsWith("PL")) return "Pháp lệnh";
  if (/^QH\d*$/.test(duoi)) return "Luật";
  if (/^UBTVQH\d*$/.test(duoi)) return "Pháp lệnh";
  return "Văn bản";
}
