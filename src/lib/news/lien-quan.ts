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
 * Cặp âm tiết liền nhau trong tiêu đề.
 *
 * Đây là chỗ sửa quan trọng nhất, và nó là chuyện ngôn ngữ chứ không phải
 * chuyện chỉnh số. Tiếng Việt viết rời từng âm tiết nhưng từ thì đa âm: "Chợ
 * Rẫy", "chú tiểu", "thả diều", "Minh Tiệp" đều là MỘT từ. Khớp theo âm tiết
 * đơn nên mới có chuyện "Con gái tuổi teen của Minh Tiệp" ghép với "Cô gái 20
 * tuổi dùng ma túy bị ném xuống sông Hồng": trùng `con`, `gái`, và `tiếp` —
 * trong đó `tiếp` chỉ là nửa cái tên riêng "Minh Tiệp" đụng phải từ phổ thông.
 *
 * Siết ngưỡng không chữa được: mỗi lần nâng lại lộ ra một cặp sai khác, vì lỗi
 * nằm ở đơn vị so khớp. Hai bài cùng một sự việc gần như luôn dùng chung ít
 * nhất một từ ghép thật — tên người, địa danh, hành vi. Hai bài khác sự việc
 * thì hầu như không bao giờ.
 *
 * Giữ nguyên thứ tự và KHÔNG bỏ hư từ trước khi ghép cặp: "thả diều" phải liền
 * nhau mới tính, còn bỏ hư từ trước sẽ dán nhầm hai âm tiết vốn cách xa nhau.
 */
export function tachCapAmTiet(chu: string): Set<string> {
  const am = boDau(chu)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 1);
  const cap = new Set<string>();
  for (let i = 0; i + 1 < am.length; i++) {
    // Cặp toàn hư từ ("của tôi", "và các") không mang thông tin định danh.
    if (HU_TU.has(am[i]) && HU_TU.has(am[i + 1])) continue;
    cap.add(`${am[i]} ${am[i + 1]}`);
  }
  return cap;
}

/**
 * Điểm liên quan trong khoảng 0..1, theo hệ số Jaccard có trọng số.
 *
 * Dùng mẫu số là tập từ của bài GỐC chứ không phải hợp của hai tập: câu hỏi
 * cần trả lời là "bài kia có nói về chuyện này không", không phải "hai bài
 * giống nhau tới đâu". Tiêu đề dài ngắn khác nhau nhiều nên hợp hai tập sẽ
 * phạt oan những tiêu đề dài.
 */
/**
 * Trọng số theo độ hiếm (IDF). Từ càng hiếm càng nói lên nhiều.
 *
 * Không có bước này thì mọi từ nặng như nhau, và tiêu đề ngắn gồm toàn từ phổ
 * thông sẽ ghép bừa. Đo được trên máy: "Con gái tuổi teen của Minh Tiệp" khớp
 * "Cô gái 20 tuổi dùng ma túy bị ném xuống sông Hồng" ở 0,75, chỉ vì trùng
 * "con", "gái", "tuổi" — ba từ có mặt ở khắp nơi. Danh sách hư từ không cứu
 * được: chúng là từ thật, chỉ là không phân biệt được gì.
 *
 * Với IDF, ba từ đó gần như không đóng góp, còn "Minh Tiệp" hay "sông Hồng"
 * mới mang điểm. Độ hiếm tính trên chính tập ứng viên đang xét nên không cần
 * từ điển dựng sẵn và tự thích nghi theo dòng tin.
 */
/**
 * Tập ứng viên nhỏ hơn ngưỡng này thì thống kê độ hiếm không đáng tin, quay về
 * cân đều. Với vài chục bài, một từ xuất hiện hai lần đã bị coi là "phổ thông".
 */
const CO_MAU_TOI_THIEU_CHO_IDF = 20;

/** Sàn trọng số: từ phổ thông tới đâu cũng còn giá trị, không bị triệt tiêu. */
const SAN_TRONG_SO = 0.25;

export function dungBangDoHiem(tapVanBan: string[]): Map<string, number> | undefined {
  if (tapVanBan.length < CO_MAU_TOI_THIEU_CHO_IDF) return undefined;
  const df = new Map<string, number>();
  for (const chu of tapVanBan) {
    for (const t of new Set(tachTuKhoa(chu))) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = tapVanBan.length;
  const idf = new Map<string, number>();
  for (const [t, d] of df) idf.set(t, Math.log((N + 1) / (d + 0.5)));
  return idf;
}

/**
 * Trọng số của một từ, luôn dương.
 *
 * Sàn 0,25 là thứ giữ cho thuật toán không tự phá. Không có sàn thì một từ có
 * mặt ở gần hết tập ứng viên nhận trọng số ~0, và nếu tiêu đề gốc toàn những
 * từ như thế thì mẫu số do các từ KHÔNG khớp chi phối — hai bài giống hệt nhau
 * vẫn ra điểm 0 và bị loại. Đó chính là điều test bắt được.
 */
function trongSo(t: string, idf?: Map<string, number>): number {
  if (!idf) return 1;
  return Math.max(SAN_TRONG_SO, idf.get(t) ?? Math.log(idf.size + 1));
}

export function diemLienQuan(
  goc: BaiDeSoSanh,
  ung: BaiDeSoSanh,
  idf?: Map<string, number>,
): number {
  const tuGoc = tachTuKhoa(goc.title);
  if (tuGoc.length === 0) return 0;

  // Tóm tắt của ứng viên cũng được tính, nhưng nhẹ hơn tiêu đề.
  const tuTieuDe = new Set(tachTuKhoa(ung.title));
  const tuTomTat = new Set(tachTuKhoa(ung.summary ?? ""));

  let duoc = 0;
  let tong = 0;
  for (const t of tuGoc) {
    const w = trongSo(t, idf);
    tong += w;
    if (tuTieuDe.has(t)) duoc += w;
    else if (tuTomTat.has(t)) duoc += w * 0.45;
  }
  return tong === 0 ? 0 : duoc / tong;
}

/** Số từ trong tiêu đề gốc xuất hiện lại ở TIÊU ĐỀ ứng viên. */
function soTuTrungTieuDe(goc: BaiDeSoSanh, ung: BaiDeSoSanh): number {
  const tuTieuDe = new Set(tachTuKhoa(ung.title));
  return tachTuKhoa(goc.title).filter((t) => tuTieuDe.has(t)).length;
}

/** Số cặp âm tiết mà hai tiêu đề dùng chung. */
function soCapTrung(goc: BaiDeSoSanh, ung: BaiDeSoSanh): number {
  const capUng = tachCapAmTiet(ung.title);
  let n = 0;
  for (const c of tachCapAmTiet(goc.title)) if (capUng.has(c)) n++;
  return n;
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
 * Ít nhất bằng này từ của tiêu đề gốc phải xuất hiện lại trong TIÊU ĐỀ ứng
 * viên — đếm số từ thật, không phải tổng điểm có trọng số.
 *
 * Bản trước kiểm bằng `diem * số từ`, mà đó là tổng điểm chứ không phải số từ,
 * nên một tiêu đề ngắn khớp vài từ ở phần tóm tắt vẫn vượt qua. Hai điều kiện
 * này chặn hai lỗi khác nhau và cần cả hai: IDF lo phần "trùng từ vô nghĩa",
 * còn điều kiện này lo phần "trùng quá ít chỗ".
 */
const SO_TU_TRUNG_TOI_THIEU = 3;

/**
 * Số CẶP ÂM TIẾT phải trùng giữa hai tiêu đề.
 *
 * Điều kiện quyết định. Một cặp trùng nghĩa là hai bài dùng chung một từ ghép
 * thật — "chợ rẫy", "chú tiểu", "thả diều", "lãi suất" — chứ không phải cùng
 * dùng những âm tiết phổ thông rời rạc.
 */
const SO_CAP_TRUNG_TOI_THIEU = 1;

export interface KetQuaLienQuan<T extends BaiDeSoSanh> {
  bai: T;
  diem: number;
}

export function xepTheoLienQuan<T extends BaiDeSoSanh>(
  goc: BaiDeSoSanh,
  ungVien: T[],
  gioiHan = 6,
): KetQuaLienQuan<T>[] {
  if (tachTuKhoa(goc.title).length === 0) return [];

  // Độ hiếm tính trên chính tập đang xét, kể cả bài gốc.
  const idf = dungBangDoHiem([
    goc.title,
    ...ungVien.map((u) => u.title),
  ]);

  return ungVien
    .filter((u) => u.id !== goc.id)
    .map((bai) => ({ bai, diem: diemLienQuan(goc, bai, idf) }))
    .filter(
      (r) =>
        r.diem >= NGUONG_LIEN_QUAN &&
        soTuTrungTieuDe(goc, r.bai) >= SO_TU_TRUNG_TOI_THIEU &&
        soCapTrung(goc, r.bai) >= SO_CAP_TRUNG_TOI_THIEU,
    )
    .sort((a, b) => b.diem - a.diem)
    .slice(0, gioiHan);
}
