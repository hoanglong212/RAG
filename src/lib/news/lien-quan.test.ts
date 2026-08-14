import { describe, expect, it } from "vitest";
import {
  boDau,
  diemLienQuan,
  NGUONG_LIEN_QUAN,
  tachTuKhoa,
  xepTheoLienQuan,
} from "./lien-quan";

/**
 * Bài gốc và tám kết quả sai lấy NGUYÊN VĂN từ máy thật — đây chính là ảnh
 * chụp mà người dùng gửi kèm khi báo tính năng hỏng.
 */
const GOC = {
  id: "goc",
  title: "Ông Trump kháng cáo phán quyết chặn xây phòng khiêu vũ lên Tòa Tối cao",
  summary:
    "Chính quyền Tổng thống Trump đề nghị Tòa Tối cao bác phán quyết tòa phúc thẩm và cho phép tiếp tục xây dựng phòng khiêu vũ tại Nhà Trắng.",
};

const RAC_CU = [
  "Đội bóng của HLV Park Hang Seo thắng đậm CLB Hoàng Anh Gia Lai",
  "Chủ Thái Lan rao bán Leicester với giá thấp không tưởng",
  "Ứng phó trước nghi vấn gian lận xuất xứ từ 'mạng lưới ngầm' hàng xuất khẩu sang Mỹ ra sao?",
  "Trần Quyết Chiến, Bao Phương Vinh cạnh tranh giải thưởng 100 triệu đồng tại Siêu cúp Billiards",
  "HLV 35 tuổi của Singapore được khen hết lời trước thềm bán kết ASEAN Cup",
  "Ông Lê Quốc Phong: Nghiêm túc đánh giá KPI cán bộ, công chức TP.HCM ngay quý 3-2026",
  "Khởi động Tuổi Trẻ Startup Award 2026, tìm giải pháp cho đô thị tương lai",
  "Đùa với thủ tục, dọa bằng mạng sống: Bạn đọc đề nghị xử lý nghiêm",
].map((title, i) => ({ id: `rac${i}`, title, summary: null }));

describe("boDau", () => {
  it("bỏ dấu và đổi đ thành d", () => {
    expect(boDau("Nghị định Đất đai")).toBe("nghi dinh dat dai");
    expect(boDau("Ủy ban nhân dân")).toBe("uy ban nhan dan");
  });
});

describe("tachTuKhoa", () => {
  it("loại hư từ, giữ từ mang nghĩa và giữ số", () => {
    const tu = tachTuKhoa("TP.HCM dự kiến giảm 704 trường công lập");
    expect(tu).toContain("704");
    expect(tu).toContain("truong");
    expect(tu).not.toContain("cua");
    expect(tu).not.toContain("va");
  });

  it("không trả về từ trùng nhau", () => {
    expect(tachTuKhoa("phạt phạt phạt")).toEqual(["phat"]);
  });
});

describe("diemLienQuan", () => {
  it("hai báo đưa cùng một sự việc thì điểm cao", () => {
    const kia = {
      id: "kia",
      title: "Trump đề nghị Tòa Tối cao cho tiếp tục xây phòng khiêu vũ Nhà Trắng",
      summary: null,
    };
    expect(diemLienQuan(GOC, kia)).toBeGreaterThan(0.4);
  });

  it("bài thể thao không dính dáng thì rơi xa dưới ngưỡng", () => {
    for (const r of RAC_CU) {
      expect(diemLienQuan(GOC, r)).toBeLessThan(NGUONG_LIEN_QUAN);
    }
  });

  /**
   * Hồi quy cho bẫy tiêu đề ngắn. Đo trên corpus thật: "Đi ngoài mỗi ngày có
   * tốt không?" từng đạt 0,72 với một bài đặc sản chẳng liên quan, chỉ vì sau
   * khi bỏ hư từ mẫu số còn quá nhỏ. Luật số-từ-trùng-tối-thiểu chặn nó.
   */
  it("tiêu đề ngắn trùng vài từ không đủ để được ghép", () => {
    const ngan = { id: "ngan", title: "Đi ngoài mỗi ngày có tốt không?" };
    const khac = {
      id: "khac",
      title: "Đặc sản muốn đi xa, bán giá cao phải có 'giấy khai sinh'",
      summary: null,
    };
    expect(xepTheoLienQuan(ngan, [khac])).toEqual([]);
  });

  it("tiêu đề gốc rỗng thì trả 0 chứ không chia cho không", () => {
    expect(diemLienQuan({ id: "x", title: "   " }, RAC_CU[0])).toBe(0);
    expect(Number.isNaN(diemLienQuan({ id: "x", title: "" }, RAC_CU[0]))).toBe(false);
  });
});

describe("xepTheoLienQuan", () => {
  it("KHÔNG trả về gì cho đúng tám bài rác đã gặp trên máy thật", () => {
    // Đây là hồi quy của chính lỗi được báo: thà rỗng còn hơn tám bài lạc đề.
    expect(xepTheoLienQuan(GOC, RAC_CU)).toEqual([]);
  });

  it("tìm ra bài cùng sự việc lẫn giữa đám rác, và xếp nó lên đầu", () => {
    const dung = {
      id: "dung",
      title: "Tòa Tối cao Mỹ xem xét kháng cáo vụ phòng khiêu vũ Nhà Trắng",
      summary: null,
    };
    const kq = xepTheoLienQuan(GOC, [...RAC_CU, dung]);
    expect(kq).toHaveLength(1);
    expect(kq[0].bai.id).toBe("dung");
  });

  it("bỏ chính bài gốc ra khỏi kết quả", () => {
    expect(xepTheoLienQuan(GOC, [{ ...GOC }])).toEqual([]);
  });

  it("tôn trọng giới hạn số lượng", () => {
    const nhieu = Array.from({ length: 12 }, (_, i) => ({
      id: `t${i}`,
      title: "Trump kháng cáo phán quyết phòng khiêu vũ Tòa Tối cao",
      summary: null,
    }));
    expect(xepTheoLienQuan(GOC, nhieu, 4)).toHaveLength(4);
  });

  it("trùng vài từ lẻ nhưng khác sự việc thì vẫn bị loại", () => {
    const gan = {
      id: "gan",
      title: "Ông Trump phát biểu về kinh tế tại Ohio",
      summary: null,
    };
    expect(xepTheoLienQuan(GOC, [gan])).toEqual([]);
  });
});
