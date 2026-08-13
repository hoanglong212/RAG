/**
 * ĐỌC CÂU TRẢ LỜI — biến chuỗi thô của LLM thành khối dựng được.
 *
 * Vì sao cần: trước đây câu trả lời đổ ra một thẻ <p> duy nhất với
 * `whitespace-pre-wrap`. Mọi thứ cùng cỡ, cùng cân, cùng màu — kết luận nằm
 * ngang hàng với câu dẫn, hai nhánh xử lý loại trừ nhau trông y như hai dòng
 * chữ nối tiếp. Người đọc phải tự phân tích cú pháp bằng mắt.
 *
 * Mô hình VẪN trả về văn bản có cấu trúc thật: một câu kết luận, một câu dẫn,
 * rồi gạch đầu dòng hai cấp. Cấu trúc đó có sẵn trong chuỗi, chỉ là chưa ai
 * đọc nó ra. Đây là chỗ đọc.
 *
 * KHÔNG phải markdown parser. Chỉ nhận đúng những dạng mô hình thật sự sinh
 * ra — đã đo trên /api/chat và /api/research — và bỏ qua phần còn lại.
 */

export type KhoiTraLoi =
  | { loai: "ketLuan"; chu: string }
  | { loai: "tieuDe"; chu: string }
  | { loai: "doan"; chu: string }
  | { loai: "danhSach"; muc: MucDanhSach[] }
  | { loai: "luuY"; chu: string };

export interface MucDanhSach {
  chu: string;
  con: string[];
}

/** Gạch đầu dòng cấp 1: "- ", "– ", "• ", "1. ", "1) ". */
const GACH_CAP_1 = /^[-–—•*]\s+|^\d{1,2}[.)]\s+/;
/** Gạch đầu dòng cấp 2: thụt lề rồi "+ ", "- ", "•". */
const GACH_CAP_2 = /^[ \t]+[+\-–—•*]\s+/;

/**
 * Tiêu đề mục của chế độ nghiên cứu sâu. RESEARCH_SYSTEM_PROMPT bắt trả theo
 * ba mục cố định, nên chúng xuất hiện nguyên văn ở đầu dòng.
 */
const TIEU_DE = /^\**\s*(Kết luận|Căn cứ(?: và phân tích)?|Phân tích|Điểm cần xác minh(?: thêm)?|Lưu ý)\s*\**\s*:?\s*$/i;
/** Cùng dạng nhưng nội dung nằm ngay sau dấu hai chấm trên cùng một dòng. */
const TIEU_DE_KEM = /^\**\s*(Kết luận|Căn cứ(?: và phân tích)?|Phân tích|Điểm cần xác minh(?: thêm)?)\s*\**\s*:\s*(.+)$/i;

/** Câu miễn trừ bắt buộc ở cuối câu trả lời nghiên cứu. */
const MIEN_TRU = /^Thông tin này phục vụ tra cứu/i;

/**
 * Bỏ `**đậm**` của markdown. Mô hình thỉnh thoảng chèn vào dù lời nhắc không
 * yêu cầu; để nguyên thì người dùng đọc thấy hai dấu sao giữa câu.
 */
function boDamMarkdown(chu: string): string {
  return chu.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1");
}

/** Ngưỡng ký tự mà một câu chốt còn đọc được ở cỡ trưng bày. */
const DAI_TOI_DA_KET_LUAN = 200;

/** Ranh giới câu: dấu chấm, khoảng trắng, rồi một chữ hoa (kể cả chữ hoa có dấu). */
const RANH_CAU = /(?<=\.)\s+(?=[A-ZĐÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂẮẰẲẴẶÂẤẦẨẪẬÊẾỀỂỄỆÔỐỒỔỖỘƠỚỜỞỠỢƯỨỪỬỮỰ])/;

function tachCauDau(chu: string): [string, string | null] {
  if (chu.length <= DAI_TOI_DA_KET_LUAN) return [chu, null];
  const cat = chu.search(RANH_CAU);
  if (cat < 0) return [chu, null];
  const dau = chu.slice(0, cat).trim();
  const con = chu.slice(cat).trim();
  return con ? [dau, con] : [dau, null];
}

export function docCauTraLoi(noiDung: string): KhoiTraLoi[] {
  const khoi: KhoiTraLoi[] = [];
  const dong = noiDung.replace(/\r\n/g, "\n").split("\n");

  let dangGomDoan: string[] = [];
  let daCoKetLuan = false;

  /** Đẩy đoạn văn xuôi đang gom ra ngoài. Câu đầu tiên là kết luận. */
  function xaDoan() {
    if (dangGomDoan.length === 0) return;
    const chu = boDamMarkdown(dangGomDoan.join(" ").trim());
    dangGomDoan = [];
    if (!chu) return;
    if (MIEN_TRU.test(chu)) {
      khoi.push({ loai: "luuY", chu });
      return;
    }
    if (!daCoKetLuan) {
      daCoKetLuan = true;
      // Đoạn đầu dài nghĩa là mô hình không xuống dòng sau câu chốt. Dựng cả
      // khối đó ở cỡ trưng bày thì không còn là nhấn nữa — cắt lấy câu đầu.
      const [dau, con] = tachCauDau(chu);
      khoi.push({ loai: "ketLuan", chu: dau });
      if (con) khoi.push({ loai: "doan", chu: con });
      return;
    }
    khoi.push({ loai: "doan", chu });
  }

  for (const raw of dong) {
    const dongTrong = raw.trim().length === 0;
    if (dongTrong) {
      xaDoan();
      continue;
    }

    if (GACH_CAP_2.test(raw)) {
      xaDoan();
      const chu = boDamMarkdown(raw.replace(GACH_CAP_2, "").trim());
      const cuoi = khoi[khoi.length - 1];
      if (cuoi?.loai === "danhSach" && cuoi.muc.length > 0) {
        cuoi.muc[cuoi.muc.length - 1].con.push(chu);
      } else {
        // Cấp 2 mà chưa có cấp 1 (mô hình thụt lề nhầm): nâng lên cấp 1.
        khoi.push({ loai: "danhSach", muc: [{ chu, con: [] }] });
      }
      continue;
    }

    const daGach = raw.trimStart();
    if (GACH_CAP_1.test(daGach)) {
      xaDoan();
      const chu = boDamMarkdown(daGach.replace(GACH_CAP_1, "").trim());
      const cuoi = khoi[khoi.length - 1];
      if (cuoi?.loai === "danhSach") cuoi.muc.push({ chu, con: [] });
      else khoi.push({ loai: "danhSach", muc: [{ chu, con: [] }] });
      continue;
    }

    const chiTieuDe = daGach.match(TIEU_DE);
    if (chiTieuDe) {
      xaDoan();
      khoi.push({ loai: "tieuDe", chu: chiTieuDe[1] });
      continue;
    }

    const tieuDeKem = daGach.match(TIEU_DE_KEM);
    if (tieuDeKem) {
      xaDoan();
      khoi.push({ loai: "tieuDe", chu: tieuDeKem[1] });
      dangGomDoan.push(tieuDeKem[2]);
      continue;
    }

    dangGomDoan.push(daGach);
  }
  xaDoan();

  return khoi;
}

/* ------------------------------------------------------------------ */

/**
 * Tách "Nếu X thì Y" thành điều kiện và hệ quả.
 *
 * Văn phong pháp lý tiếng Việt gần như luôn dựng câu theo khuôn này, và hai vế
 * có trọng số khác hẳn nhau: người đọc quét các vế ĐIỀU KIỆN để tìm trường hợp
 * của mình, rồi mới đọc kỹ vế HỆ QUẢ. In cả hai cùng một cân chữ là bắt họ đọc
 * hết mới biết đoạn này có liên quan không.
 *
 * Chỉ tách khi câu MỞ ĐẦU bằng một từ dẫn điều kiện — nếu không, chữ "thì" ở
 * giữa câu là liên từ bình thường và cắt vào đó sẽ ra hai mảnh vô nghĩa.
 */
const MO_DAU_DIEU_KIEN = /^(Nếu|Trường hợp|Khi|Đối với|Trong trường hợp)\b/;

export function tachDieuKienHeQua(chu: string): { dieuKien: string; heQua: string } | null {
  if (!MO_DAU_DIEU_KIEN.test(chu)) return null;
  // [\s\S] thay cho cờ /s: target tsconfig thấp hơn es2018 nên dotAll không dùng được.
  const khop = chu.match(/^([\s\S]+?[,\s])thì\s+([\s\S]+)$/);
  if (!khop) return null;
  const dieuKien = khop[1].replace(/[,\s]+$/, "").trim();
  const heQua = khop[2].trim();
  // Một vế cụt thì tách chỉ làm câu khó đọc hơn.
  if (dieuKien.length < 8 || heQua.length < 8) return null;
  return { dieuKien, heQua };
}
