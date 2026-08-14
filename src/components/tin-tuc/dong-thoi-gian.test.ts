import { describe, expect, it } from "vitest";
import { doDoTuoi, gomTheoNgay, khoangCachTu, nhanNgay } from "./dong-thoi-gian";
import type { NewsArticleSummary } from "@/types/news";

/** Mốc cố định để test không đổi kết quả theo ngày chạy. */
const BAY_GIO = new Date(2026, 7, 14, 22, 0, 0); // 14/08/2026 22:00 giờ địa phương

function bai(id: string, publishedAt: string | null): NewsArticleSummary {
  return {
    id,
    source: { slug: "tuoi-tre", name: "Tuổi Trẻ", homepageUrl: "https://tuoitre.vn" },
    title: `Bài ${id}`,
    summary: null,
    url: `https://tuoitre.vn/${id}`,
    imageUrl: null,
    publishedAt,
    topics: [],
    keywords: [],
    locations: [],
  };
}

/** ISO theo giờ địa phương, tránh lệch múi giờ khi so ngày. */
function iso(nam: number, thang: number, ngay: number, gio = 12, phut = 0): string {
  return new Date(nam, thang - 1, ngay, gio, phut).toISOString();
}

describe("nhanNgay", () => {
  it("gọi tên hai ngày gần nhất bằng lời, không bằng số", () => {
    expect(nhanNgay("2026-08-14", BAY_GIO)).toBe("Hôm nay");
    expect(nhanNgay("2026-08-13", BAY_GIO)).toBe("Hôm qua");
  });

  it("trong tuần thì dùng thứ, xa hơn thì dùng ngày tháng", () => {
    expect(nhanNgay("2026-08-12", BAY_GIO)).toBe("Thứ tư, 12/08");
    expect(nhanNgay("2026-07-20", BAY_GIO)).toBe("20/07");
  });

  it("qua một năm thì phải có năm, nếu không 12/08 nào cũng như nhau", () => {
    expect(nhanNgay("2025-06-01", BAY_GIO)).toBe("01/06/2025");
  });
});

describe("gomTheoNgay", () => {
  it("gom đúng ngày và xếp ngày mới nhất lên trước", () => {
    const nhom = gomTheoNgay(
      [
        bai("a", iso(2026, 8, 12, 16, 22)),
        bai("b", iso(2026, 8, 14, 21, 42)),
        bai("c", iso(2026, 8, 14, 20, 10)),
      ],
      BAY_GIO,
    );
    expect(nhom.map((n) => n.nhan)).toEqual(["Hôm nay", "Thứ tư, 12/08"]);
    expect(nhom[0].bai.map((b) => b.id)).toEqual(["b", "c"]);
  });

  it("KHÔNG tạo nhóm cho ngày không có bài — khoảng trống phải hiện ra", () => {
    // Đúng tình trạng đo được: có 12/08 và 14/08, không có 13/08.
    const nhom = gomTheoNgay([bai("a", iso(2026, 8, 12)), bai("b", iso(2026, 8, 14))], BAY_GIO);
    expect(nhom.map((n) => n.khoa)).toEqual(["2026-08-14", "2026-08-12"]);
    expect(nhom.some((n) => n.nhan === "Hôm qua")).toBe(false);
  });

  it("dồn bài thiếu hoặc hỏng thời điểm xuống cuối, không vứt đi", () => {
    const nhom = gomTheoNgay(
      [bai("a", iso(2026, 8, 14)), bai("b", null), bai("c", "không-phải-ngày")],
      BAY_GIO,
    );
    expect(nhom[nhom.length - 1].nhan).toBe("Không rõ thời điểm");
    expect(nhom[nhom.length - 1].bai.map((b) => b.id)).toEqual(["b", "c"]);
  });

  it("danh sách rỗng ra mảng rỗng, không ra nhóm ma", () => {
    expect(gomTheoNgay([], BAY_GIO)).toEqual([]);
  });
});

describe("doDoTuoi", () => {
  it("dưới 2 giờ là mới", () => {
    expect(doDoTuoi(iso(2026, 8, 14, 21, 42), BAY_GIO)).toMatchObject({
      mucDo: "moi",
      moTa: "18 phút trước",
    });
  });

  it("trong ngày nhưng chưa cũ", () => {
    expect(doDoTuoi(iso(2026, 8, 14, 16, 0), BAY_GIO).mucDo).toBe("trongNgay");
  });

  it("quá 12 giờ là cũ — đây là ngưỡng bắt được sự cố đã xảy ra", () => {
    // Tình trạng thật ngày 14/08: bài mới nhất là 12/08 16:22.
    const kq = doDoTuoi(iso(2026, 8, 12, 16, 22), BAY_GIO);
    expect(kq.mucDo).toBe("cu");
    expect(kq.moTa).toBe("2 ngày trước");
  });

  it("chưa có bài nào cũng là trạng thái cũ, không phải trạng thái trống", () => {
    expect(doDoTuoi(null, BAY_GIO)).toMatchObject({ mucDo: "cu", gio: null });
  });
});

describe("khoangCachTu", () => {
  it("mốc trong tương lai không ra số âm", () => {
    expect(khoangCachTu(iso(2026, 8, 15, 10, 0), BAY_GIO)).toBe("vừa xong");
  });

  it("chuỗi hỏng trả rỗng thay vì NaN", () => {
    expect(khoangCachTu("hôm nọ", BAY_GIO)).toBe("");
  });
});
