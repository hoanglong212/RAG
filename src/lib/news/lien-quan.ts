/**
 * ĐO ĐỘ LIÊN QUAN GIỮA HAI BÀI TIN — cho tính năng "So sánh nguồn".
 *
 * Tiêu chí của tính năng: xem CÁC BÁO KHÁC viết gì về CÙNG MỘT SỰ VIỆC. Nó là
 * bộ ghép cùng-sự-việc, không phải bộ ghép cùng-chủ-đề.
 *
 * Bản cũ ghép bằng `a.topics && b.topics OR a.keywords && b.keywords` rồi xếp
 * theo khoảng cách thời gian. Đo trên máy thật thì cách đó sụp hoàn toàn:
 *
 *   - 120/267 bài (45%) mang đúng một chủ đề "khac" và có keywords RỖNG;
 *   - nên điều kiện rút gọn thành "bất kỳ bài nào cũng gắn khac";
 *   - và thứ tự cuối cùng chỉ còn là "bài đăng gần giờ nhất".
 *
 * Kết quả thực tế: bài "Ông Trump kháng cáo phán quyết chặn xây phòng khiêu vũ
 * lên Tòa Tối cao" trả về Park Hang Seo, Leicester, billiards và ASEAN Cup.
 *
 * Ở đây đo bằng từ vựng thật trong tiêu đề. Không có pg_trgm trong cluster nên
 * chấm điểm bằng TypeScript; corpus vài trăm bài nên chi phí không đáng kể, đổi
 * lại là một hàm thuần kiểm thử được.
 *
 * NGUYÊN TẮC QUAN TRỌNG NHẤT: thà không trả gì còn hơn trả bài không liên quan.
 * Một danh sách rỗng nói "chưa báo nào khác đưa tin này" — đúng và dùng được.
 * Tám bài thể thao thì không nói gì cả, mà còn làm hỏng lòng tin vào cả trang.
 */

/**
 * Hư từ tiếng Việt và vài từ tin tức xuất hiện ở mọi tiêu đề.
 *
 * Không có bộ từ điển tiếng Việt cho full-text search của Postgres, mà tiếng
 * Việt cũng không biến hình nên không cần stemming — chỉ cần loại hư từ.
 */
const HU_TU = new Set([
  "va", "cua", "cho", "voi", "tu", "den", "trong", "ngoai", "tren", "duoi",
  "la", "co", "khong", "da", "se", "dang", "bi", "duoc", "phai", "van",
  "nhung", "ma", "neu", "thi", "nen", "vi", "do", "boi", "tai", "ve",
  "mot", "hai", "cac", "nhung", "moi", "nhieu", "it", "nay", "kia", "ay",
  "nguoi", "ong", "ba", "anh", "chi", "em", "minh", "ho", "no",
  "sau", "truoc", "khi", "luc", "ngay", "nam", "thang", "tuan",
  "ra", "vao", "len", "xuong", "qua", "lai", "roi", "cung", "chi",
  "hon", "nhat", "rat", "qua", "lam", "bang", "theo", "de", "cho",
  "tin", "bao", "moi", "vua", "tiep", "van", "sao", "gi", "nao",
]);

/** Bỏ dấu và hạ chữ thường — so khớp không phụ thuộc dấu và chữ hoa. */
export function boDau(chu: string): string {
  // ̀-ͯ là dải dấu tổ hợp; viết dạng escape để khỏi phụ thuộc mã hóa file.
  return chu
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Tách tiêu đề thành tập từ có nghĩa.
 *
 * Giữ cả số: "704 trường" và "465 hiệu trưởng" là những con số định danh một
 * sự việc cụ thể, và chúng là tín hiệu mạnh nhất khi hai báo cùng đưa một tin.
 */
export function tachTuKhoa(chu: string): string[] {
  const tu = boDau(chu)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !HU_TU.has(t));
  return [...new Set(tu)];
}

export interface BaiDeSoSanh {
  id: string;
  title: string;
  summary?: string | null;
}

/**
 * Điểm liên quan trong khoảng 0..1, theo hệ số Jaccard có trọng số.
 *
 * Dùng mẫu số là tập từ của bài GỐC chứ không phải hợp của hai tập: câu hỏi
 * cần trả lời là "bài kia có nói về chuyện này không", không phải "hai bài
 * giống nhau tới đâu". Tiêu đề dài ngắn khác nhau nhiều nên hợp hai tập sẽ
 * phạt oan những tiêu đề dài.
 */
export function diemLienQuan(goc: BaiDeSoSanh, ung: BaiDeSoSanh): number {
  const tuGoc = tachTuKhoa(goc.title);
  if (tuGoc.length === 0) return 0;

  // Tóm tắt của ứng viên cũng được tính, nhưng nhẹ hơn tiêu đề.
  const tuTieuDe = new Set(tachTuKhoa(ung.title));
  const tuTomTat = new Set(tachTuKhoa(ung.summary ?? ""));

  let diem = 0;
  for (const t of tuGoc) {
    if (tuTieuDe.has(t)) diem += 1;
    else if (tuTomTat.has(t)) diem += 0.45;
  }
  return diem / tuGoc.length;
}

/**
 * Ngưỡng nhận là "cùng một sự việc". Chọn bằng cách đo, không bằng cảm tính.
 *
 * Quét toàn bộ 267 bài, lấy mọi cặp khác nguồn trong vòng 3 ngày rồi nhìn phân
 * bố điểm:
 *
 *   ≥ 0,65   gần như toàn cặp đúng — "Tô Lâm đến Auckland" ↔ "Tô Lâm bắt đầu
 *            thăm cấp nhà nước New Zealand" (0,95); "Trần Cẩm Tú dự lễ truy
 *            điệu Chủ tịch Quốc hội Lào" trùng nhau (1,00)
 *   0,45–0,5 lẫn lộn — "TP.HCM tựu trường 17/8" ↔ "TP.HCM công bố ngày tựu
 *            trường" (0,45) là đúng, nhưng "Quán cà phê hai màu trắng - đen"
 *            ↔ "thanh tra dự án giải ngân vốn đầu tư công" (0,49) thì không
 *   ≈ 0,30   rác thuần — "Trump muốn tranh cử nhiệm kỳ 3" ↔ "Vợ bảo thu nhập
 *            anh có dư đâu" (0,31)
 *
 * Lấy 0,55 là chấp nhận mất vài cặp đúng ở vùng 0,45 để không cho lọt cặp sai
 * ở cùng vùng đó. Đánh đổi này có chủ ý: tính năng chỉ có giá trị khi thứ nó
 * trả về đáng tin, còn thiếu một bài thì người dùng vẫn còn nút tra cứu.
 */
export const NGUONG_LIEN_QUAN = 0.55;

/**
 * Ít nhất bằng này từ phải trùng.
 *
 * Đây mới là thứ chặn được lỗi tiêu đề ngắn. "Đi ngoài mỗi ngày có tốt không?"
 * sau khi bỏ hư từ chỉ còn vài từ, nên trùng hai từ đã cho 0,72 với một bài
 * đặc sản chẳng liên quan. Tỉ lệ một mình không đủ khi mẫu số quá nhỏ.
 */
const SO_TU_TRUNG_TOI_THIEU = 3;

export interface KetQuaLienQuan<T extends BaiDeSoSanh> {
  bai: T;
  diem: number;
}

export function xepTheoLienQuan<T extends BaiDeSoSanh>(
  goc: BaiDeSoSanh,
  ungVien: T[],
  gioiHan = 6,
): KetQuaLienQuan<T>[] {
  const tuGoc = tachTuKhoa(goc.title);
  if (tuGoc.length === 0) return [];

  return ungVien
    .filter((u) => u.id !== goc.id)
    .map((bai) => ({ bai, diem: diemLienQuan(goc, bai) }))
    .filter((r) => r.diem >= NGUONG_LIEN_QUAN && r.diem * tuGoc.length >= SO_TU_TRUNG_TOI_THIEU)
    .sort((a, b) => b.diem - a.diem)
    .slice(0, gioiHan);
}
