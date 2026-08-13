import { describe, expect, it } from "vitest";
import { docCauTraLoi, tachDieuKienHeQua } from "./doc-cau-tra-loi";
import { chiDieuKhoan, loaiVanBan, timNeo, type NguonDeNeo } from "./neo-trich-dan";

/**
 * Chuỗi này lấy nguyên văn từ /api/chat, không phải viết tay cho vừa test.
 * Mọi thay đổi ở đây phải đo lại bằng câu trả lời thật.
 */
const TRA_LOI_THAT = [
  "Nghị định 281/2026/NĐ-CP có hiệu lực thi hành từ ngày 31 tháng 8 năm 2026.",
  "",
  "Đối với hành vi xảy ra trước ngày nghị định có hiệu lực nhưng chưa có quyết định xử phạt, sẽ áp dụng quy định như sau:",
  "",
  "- Nếu đã lập biên bản và đã có quyết định xử phạt nhưng chưa thực hiện xong quyết định xử phạt thì tiếp tục thực hiện theo quyết định đã ban hành (điểm a, khoản 2, Điều 11).",
  "- Nếu hành vi vi phạm hành chính đã được lập biên bản vi phạm hành chính mà chưa ban hành quyết định xử phạt vi phạm hành chính, thì sẽ xử lý như sau:",
  " + Nếu đã hết thời hiệu xử phạt vi phạm hành chính hoặc hết thời hạn ra quyết định xử phạt vi phạm hành chính theo quy định tại điểm c khoản 1 Điều 65 Luật Xử lý vi phạm hành chính thì không ra quyết định xử phạt nhưng vẫn phải ra quyết định áp dụng biện pháp khắc phục hậu quả (nếu có) (điểm b, khoản 2, Điều 11).",
  " + Nếu còn thời hạn ban hành quyết định xử phạt thì mức xử phạt và biện pháp khắc phục hậu quả áp dụng theo Nghị định về xử phạt vi phạm hành chính trong lĩnh vực đất đai tại thời điểm lập biên bản vi phạm hành chính (điểm b, khoản 2, Điều 11).",
].join("\n");

const NGUON: NguonDeNeo[] = [
  { soHieu: "281/2026/NĐ-CP", breadcrumb: "Nghị quyết 281/2026/NĐ-CP > Điều 11 > Khoản 3", score: 0.564 },
  { soHieu: "281/2026/NĐ-CP", breadcrumb: "Nghị quyết 281/2026/NĐ-CP > Điều 11 > Khoản 2", score: 0.584 },
  { soHieu: "281/2026/NĐ-CP", breadcrumb: "Nghị quyết 281/2026/NĐ-CP > Điều 10", score: 0.514 },
  { soHieu: "123/2024/NĐ-CP", breadcrumb: "Nghị định 123/2024/NĐ-CP > Chương IV > Điều 34 > Khoản 2", score: 0.463 },
  { soHieu: "19/2023/QH15", breadcrumb: "Luật 19/2023/QH15 > Chương I > Điều 10 > Khoản 5", score: 0.444 },
];

describe("docCauTraLoi", () => {
  const khoi = docCauTraLoi(TRA_LOI_THAT);

  it("nhận câu đầu làm kết luận, không lẫn với đoạn dẫn", () => {
    expect(khoi[0]).toEqual({
      loai: "ketLuan",
      chu: "Nghị định 281/2026/NĐ-CP có hiệu lực thi hành từ ngày 31 tháng 8 năm 2026.",
    });
    expect(khoi[1].loai).toBe("doan");
  });

  it("gom hai gạch đầu dòng cấp 1 vào một danh sách", () => {
    const ds = khoi.find((k) => k.loai === "danhSach");
    expect(ds?.loai).toBe("danhSach");
    if (ds?.loai !== "danhSach") throw new Error("thiếu danh sách");
    expect(ds.muc).toHaveLength(2);
  });

  it("gắn hai gạch cấp 2 vào đúng mục cha, không nâng lên cấp 1", () => {
    const ds = khoi.find((k) => k.loai === "danhSach");
    if (ds?.loai !== "danhSach") throw new Error("thiếu danh sách");
    expect(ds.muc[0].con).toHaveLength(0);
    expect(ds.muc[1].con).toHaveLength(2);
    expect(ds.muc[1].con[0]).toMatch(/^Nếu đã hết thời hiệu/);
  });

  it("tách mục nghiên cứu sâu và câu miễn trừ", () => {
    const r = docCauTraLoi(
      "Kết luận\nMức phạt là 5 triệu đồng.\n\nĐiểm cần xác minh thêm: chưa rõ thời điểm lập biên bản.\n\nThông tin này phục vụ tra cứu, không thay thế tư vấn pháp lý cho hồ sơ cụ thể.",
    );
    expect(r.map((k) => k.loai)).toEqual(["tieuDe", "ketLuan", "tieuDe", "doan", "luuY"]);
    expect(r[2]).toEqual({ loai: "tieuDe", chu: "Điểm cần xác minh thêm" });
  });

  it("gỡ dấu sao markdown khỏi chữ hiển thị", () => {
    const r = docCauTraLoi("Mức phạt là **5 triệu đồng** theo quy định.");
    expect(r[0].loai === "ketLuan" && r[0].chu).toBe("Mức phạt là 5 triệu đồng theo quy định.");
  });

  it("không sinh khối rỗng từ chuỗi trắng", () => {
    expect(docCauTraLoi("   \n\n  \n")).toEqual([]);
  });

  it("cắt câu đầu ra khỏi đoạn mở dài, không dựng cả khối ở cỡ trưng bày", () => {
    const dai =
      "Nghị định này có hiệu lực từ ngày 31 tháng 8 năm 2026. " +
      "Các quy định chuyển tiếp được áp dụng cho hành vi xảy ra trước thời điểm đó, " +
      "trong đó phân biệt trường hợp đã lập biên bản và trường hợp chưa lập biên bản, " +
      "đồng thời xác định thẩm quyền của từng cơ quan có liên quan.";
    const r = docCauTraLoi(dai);
    expect(r).toHaveLength(2);
    expect(r[0]).toEqual({
      loai: "ketLuan",
      chu: "Nghị định này có hiệu lực từ ngày 31 tháng 8 năm 2026.",
    });
    expect(r[1].loai).toBe("doan");
  });

  it("giữ nguyên đoạn mở ngắn, không cắt vụn", () => {
    const r = docCauTraLoi("Mức phạt là 5 triệu đồng. Áp dụng từ 2026.");
    expect(r).toHaveLength(1);
    expect(r[0].loai === "ketLuan" && r[0].chu).toBe("Mức phạt là 5 triệu đồng. Áp dụng từ 2026.");
  });
});

describe("tachDieuKienHeQua", () => {
  it("tách đúng vế điều kiện và vế hệ quả", () => {
    const r = tachDieuKienHeQua(
      "Nếu đã lập biên bản và đã có quyết định xử phạt nhưng chưa thực hiện xong quyết định xử phạt thì tiếp tục thực hiện theo quyết định đã ban hành.",
    );
    expect(r?.dieuKien).toMatch(/^Nếu đã lập biên bản/);
    expect(r?.heQua).toBe("tiếp tục thực hiện theo quyết định đã ban hành.");
  });

  it("bỏ qua chữ 'thì' giữa câu không mở đầu bằng từ dẫn điều kiện", () => {
    expect(tachDieuKienHeQua("Cơ quan thuế thì có thẩm quyền xử phạt.")).toBeNull();
  });

  it("bỏ qua khi một vế cụt", () => {
    expect(tachDieuKienHeQua("Nếu vậy thì thôi.")).toBeNull();
  });
});

describe("timNeo", () => {
  it("giải 'khoản 2, Điều 11' về đúng nguồn có cả Điều lẫn Khoản khớp", () => {
    const neo = timNeo("theo quy định tại điểm a, khoản 2, Điều 11 của nghị định", NGUON);
    const dk = neo.find((n) => n.loai === "dieuKhoan");
    expect(dk?.so).toBe(2);
    expect(dk?.chu).toBe("điểm a, khoản 2, Điều 11");
  });

  it("KHÔNG neo nhầm sang Khoản khác của cùng Điều", () => {
    expect(timNeo("khoản 9 Điều 11", NGUON).find((n) => n.loai === "dieuKhoan")?.so).toBe(0);
  });

  it("để trung tính dẫn chiếu tới văn bản ngoài kho", () => {
    const neo = timNeo("tại điểm c khoản 1 Điều 65 Luật Xử lý vi phạm hành chính", NGUON);
    expect(neo.find((n) => n.loai === "dieuKhoan")?.so).toBe(0);
  });

  it("Điều không kèm Khoản thì lấy nguồn điểm cao nhất có Điều đó", () => {
    // Điều 10 có ở nguồn 3 (0,514) và nguồn 5 (0,444).
    expect(timNeo("quy định tại Điều 10", NGUON).find((n) => n.loai === "dieuKhoan")?.so).toBe(3);
  });

  it("neo số hiệu về đoạn ĐIỂM CAO NHẤT của văn bản, không phải đoạn đầu tiên", () => {
    // 281/2026/NĐ-CP có ở nguồn 1 (0,564), 2 (0,584) và 3 (0,514).
    const neo = timNeo("Nghị định 281/2026/NĐ-CP có hiệu lực", NGUON);
    expect(neo.find((n) => n.loai === "soHieu")).toMatchObject({ so: 2, chu: "281/2026/NĐ-CP" });
    expect(timNeo("Nghị định 999/1999/NĐ-CP", NGUON)[0].so).toBe(0);
  });

  it("vẫn nhận dấu [n] theo hợp đồng gốc, và bỏ số ngoài danh sách", () => {
    const neo = timNeo("khẳng định [2] và [99]", NGUON);
    expect(neo.map((n) => n.so)).toEqual([2, 0]);
  });

  it("không trả về hai neo chồng lấn nhau", () => {
    const neo = timNeo("điểm a, khoản 2, Điều 11", NGUON);
    expect(neo).toHaveLength(1);
  });
});

describe("chiDieuKhoan", () => {
  it("bỏ tên văn bản và Chương, chỉ giữ Điều · Khoản", () => {
    expect(chiDieuKhoan("Nghị quyết 281/2026/NĐ-CP > Điều 11 > Khoản 2")).toBe("Điều 11 · Khoản 2");
    expect(chiDieuKhoan("Nghị định 123/2024/NĐ-CP > Chương IV > Điều 34 > Khoản 2")).toBe(
      "Điều 34 · Khoản 2",
    );
  });

  it("giữ nguyên chuỗi khi không có đoạn Điều/Khoản nào", () => {
    expect(chiDieuKhoan("Phụ lục I")).toBe("Phụ lục I");
  });
});

describe("loaiVanBan", () => {
  it("suy loại từ đuôi số hiệu, sửa được nhãn sai của breadcrumb", () => {
    expect(loaiVanBan("281/2026/NĐ-CP")).toBe("Nghị định");
    expect(loaiVanBan("47/2010/TT-BCT")).toBe("Thông tư");
    expect(loaiVanBan("19/2023/QH15")).toBe("Luật");
    expect(loaiVanBan("abc")).toBe("Văn bản");
  });
});
