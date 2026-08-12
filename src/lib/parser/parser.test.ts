/**
 * 12 tinh huong bat buoc o PLAN.md muc 7.4, cong them 2 test cho quy tac cat chunk o muc 7.2.
 */
import { describe, expect, it } from "vitest";
import { parseVanBan } from "./index";
import { chuanHoaVanBan, soLaMaSangSo, tachCauTruc } from "./structure";
import type { ChunkParse } from "./types";

/* ------------------------------------------------------------------ */
/* Van ban mau                                                         */
/* ------------------------------------------------------------------ */

const ND_15_2020 = `CHÍNH PHỦ

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc

Số: 15/2020/NĐ-CP

Hà Nội, ngày 15 tháng 02 năm 2020

NGHỊ ĐỊNH
Quy định chi tiết thi hành một số điều của Luật An toàn thực phẩm

Căn cứ Luật Tổ chức Chính phủ ngày 19 tháng 6 năm 2015;

Chương I
QUY ĐỊNH CHUNG

Điều 1. Phạm vi điều chỉnh
Nghị định này quy định chi tiết thi hành một số điều của Luật An toàn thực phẩm.

Chương II
ĐIỀU KIỆN CẤP GIẤY PHÉP

Mục 1. Điều kiện chung

Điều 8. Điều kiện cấp giấy phép
1. Cơ sở sản xuất phải đáp ứng các điều kiện chung theo quy định của pháp luật.
2. Hồ sơ đề nghị cấp giấy phép gồm:
a) Đơn đề nghị theo mẫu quy định tại Phụ lục I;
b) Bản sao giấy chứng nhận đăng ký kinh doanh;
c) Bản thuyết minh về cơ sở vật chất, trang thiết bị.
3. Trường hợp quy định tại điểm b khoản 2 Điều này thì phải nộp bản chính.

Điều 42. Hiệu lực thi hành
Nghị định này có hiệu lực thi hành kể từ ngày 02 tháng 02 năm 2020.
`;

const TT_08_2023 = `BỘ TÀI CHÍNH

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc

Số: 08/2023/TT-BTC

Hà Nội, ngày 20 tháng 01 năm 2023

THÔNG TƯ
Hướng dẫn chế độ kế toán áp dụng cho doanh nghiệp nhỏ và vừa

Căn cứ Luật Kế toán ngày 20 tháng 11 năm 2015;

Điều 1. Phạm vi điều chỉnh
Thông tư này hướng dẫn chế độ kế toán áp dụng cho doanh nghiệp nhỏ và vừa.

Điều 2. Đối tượng áp dụng
1. Doanh nghiệp nhỏ và vừa thuộc mọi lĩnh vực, mọi thành phần kinh tế.
2. Doanh nghiệp siêu nhỏ thực hiện theo quy định riêng của Bộ Tài chính.
`;

function timChunk(
  chunks: ChunkParse[],
  dieu: number,
  khoan: number | null = null,
  diem: string | null = null,
): ChunkParse {
  const c = chunks.find(
    (x) => x.dieu_so === dieu && x.khoan_so === khoan && x.diem === diem,
  );
  if (!c) {
    throw new Error(
      `Khong tim thay chunk Dieu ${dieu} Khoan ${khoan} Diem ${diem}. Co: ` +
        chunks.map((x) => x.duong_dan).join(" | "),
    );
  }
  return c;
}

/* ------------------------------------------------------------------ */

describe("Tinh huong 1 — day du Chuong > Muc > Dieu > Khoan > Diem", () => {
  const kq = parseVanBan(ND_15_2020, { tenFile: "nd-15-2020.pdf" });

  it("nhan dang du 3 Dieu", () => {
    const soDieu = [...new Set(kq.chunks.map((c) => c.dieu_so))].filter(
      (x) => x !== null,
    );
    expect(soDieu).toEqual([1, 8, 42]);
  });

  it("gan dung Chuong va Muc cho Dieu 8", () => {
    const c = timChunk(kq.chunks, 8, 1);
    expect(c.chuong).toBe("Chương II");
    expect(c.chuong_tieu_de).toBe("ĐIỀU KIỆN CẤP GIẤY PHÉP");
    expect(c.muc).toBe("Mục 1");
    expect(c.dieu_tieu_de).toBe("Điều kiện cấp giấy phép");
  });

  it("duong_dan day du tu ten van ban toi Khoan", () => {
    expect(timChunk(kq.chunks, 8, 3).duong_dan).toBe(
      "Nghị định 15/2020/NĐ-CP > Chương II > Mục 1 > Điều 8 > Khoản 3",
    );
  });

  it("noi_dung_kem_ngu_canh nhoi ngu canh cha vao dau chunk", () => {
    const c = timChunk(kq.chunks, 8, 3);
    expect(c.noi_dung_kem_ngu_canh.startsWith("[Nghị định 15/2020/NĐ-CP —")).toBe(true);
    expect(c.noi_dung_kem_ngu_canh).toContain(
      "Điều 8: Điều kiện cấp giấy phép — Khoản 3]",
    );
    expect(c.noi_dung_kem_ngu_canh).toContain(c.noi_dung);
  });

  it("mot Khoan la mot chunk, khong bac cau qua hai Dieu", () => {
    const cuaDieu8 = kq.chunks.filter((c) => c.dieu_so === 8);
    expect(cuaDieu8.map((c) => c.khoan_so)).toEqual([1, 2, 3]);
    for (const c of cuaDieu8) {
      expect(c.noi_dung).not.toContain("Điều 42");
      expect(c.noi_dung).not.toContain("Phạm vi điều chỉnh");
    }
  });
});

describe("Tinh huong 2 — chi co Dieu, khong co Chuong", () => {
  const kq = parseVanBan(TT_08_2023, { tenFile: "tt-08-2023.pdf" });

  it("chuong va muc deu null", () => {
    for (const c of kq.chunks) {
      expect(c.chuong).toBeNull();
      expect(c.muc).toBeNull();
    }
  });

  it("duong_dan bo qua Chuong", () => {
    expect(timChunk(kq.chunks, 2, 1).duong_dan).toBe(
      "Thông tư 08/2023/TT-BTC > Điều 2 > Khoản 1",
    );
  });
});

describe("Tinh huong 3 — Dieu khong co Khoan thi ca Dieu la mot chunk", () => {
  const kq = parseVanBan(ND_15_2020);

  it("Dieu 1 chi sinh dung mot chunk, khoan_so null", () => {
    const cuaDieu1 = kq.chunks.filter((c) => c.dieu_so === 1);
    expect(cuaDieu1).toHaveLength(1);
    expect(cuaDieu1[0].khoan_so).toBeNull();
    expect(cuaDieu1[0].noi_dung).toBe(
      "Nghị định này quy định chi tiết thi hành một số điều của Luật An toàn thực phẩm.",
    );
  });
});

describe("Tinh huong 4 — Khoan co Diem a, b, c", () => {
  const kq = parseVanBan(ND_15_2020);

  it("Diem nam gon trong chunk cua Khoan khi chua vuot nguong", () => {
    const c = timChunk(kq.chunks, 8, 2);
    expect(c.noi_dung).toContain("a) Đơn đề nghị theo mẫu");
    expect(c.noi_dung).toContain("b) Bản sao giấy chứng nhận đăng ký kinh doanh");
    expect(c.noi_dung).toContain("c) Bản thuyết minh về cơ sở vật chất");
    expect(c.diem).toBeNull();
  });

  it("khong sinh chunk rieng cho tung Diem khi Khoan con ngan", () => {
    expect(kq.chunks.filter((c) => c.diem !== null)).toHaveLength(0);
  });
});

describe("Tinh huong 5 — so hieu dang 15/2020/ND-CP", () => {
  const kq = parseVanBan(ND_15_2020);

  it("boc dung metadata", () => {
    expect(kq.metadata.so_hieu).toBe("15/2020/NĐ-CP");
    expect(kq.metadata.loai_van_ban).toBe("Nghị định");
    expect(kq.metadata.loai_van_ban_raw).toBe("NGHỊ ĐỊNH");
    expect(kq.metadata.co_quan_ban_hanh).toBe("CHÍNH PHỦ");
    expect(kq.metadata.ngay_ban_hanh).toBe("2020-02-15");
    expect(kq.metadata.ngay_hieu_luc).toBe("2020-02-02");
    expect(kq.metadata.trich_yeu).toBe(
      "Quy định chi tiết thi hành một số điều của Luật An toàn thực phẩm",
    );
  });
});

describe("Tinh huong 6 — so hieu dang 08/2023/TT-BTC", () => {
  const kq = parseVanBan(TT_08_2023);

  it("boc dung metadata", () => {
    expect(kq.metadata.so_hieu).toBe("08/2023/TT-BTC");
    expect(kq.metadata.loai_van_ban).toBe("Thông tư");
    expect(kq.metadata.co_quan_ban_hanh).toBe("BỘ TÀI CHÍNH");
    expect(kq.metadata.ngay_ban_hanh).toBe("2023-01-20");
  });
});

describe("Tinh huong 7 — co bang bieu chen giua cac Dieu", () => {
  const vanBan = `Điều 6. Mức thu phí
Mức thu phí được quy định như sau:
| STT | Loại hình | Mức thu |
| 1 | Cơ sở nhỏ lẻ | 500.000 |
| 2 | Cơ sở lớn | 1.000.000 |
Điều 7. Quản lý và sử dụng phí
Cơ quan thu phí nộp toàn bộ số tiền phí thu được vào ngân sách nhà nước.
`;
  const kq = parseVanBan(vanBan, { tenFile: "phi.pdf" });

  it("bang khong pha vo ranh gioi Dieu", () => {
    expect([...new Set(kq.chunks.map((c) => c.dieu_so))]).toEqual([6, 7]);
  });

  it("dong bang khong bi hieu nham thanh Khoan", () => {
    expect(kq.chunks.every((c) => c.khoan_so === null)).toBe(true);
  });

  it("giu nguyen cac dong cua bang trong chunk cua Dieu 6", () => {
    const c = timChunk(kq.chunks, 6);
    expect(c.noi_dung).toContain("| STT | Loại hình | Mức thu |");
    expect(c.noi_dung).toContain("| 2 | Cơ sở lớn | 1.000.000 |");
    expect(c.noi_dung).not.toContain("ngân sách nhà nước");
  });
});

describe("Tinh huong 8 — phu luc o cuoi phai tach rieng", () => {
  const vanBan = `Điều 20. Điều khoản thi hành
Các bộ, ngành có liên quan chịu trách nhiệm thi hành Nghị định này.

PHỤ LỤC I
DANH MỤC HỒ SƠ ĐỀ NGHỊ CẤP GIẤY PHÉP
1. Đơn đề nghị cấp giấy phép.
2. Bản sao giấy chứng nhận đăng ký kinh doanh.
`;
  const kq = parseVanBan(vanBan, { tenFile: "nd.pdf" });

  it("phu luc thanh chunk rieng, khong gan vao Dieu nao", () => {
    const pl = kq.chunks.filter((c) => c.phu_luc !== null);
    expect(pl).toHaveLength(1);
    expect(pl[0].phu_luc).toBe("PHỤ LỤC I");
    expect(pl[0].dieu_so).toBeNull();
    expect(pl[0].noi_dung).toContain("DANH MỤC HỒ SƠ ĐỀ NGHỊ CẤP GIẤY PHÉP");
  });

  it("noi dung phu luc khong bi tron vao Dieu 20", () => {
    expect(timChunk(kq.chunks, 20).noi_dung).not.toContain("DANH MỤC HỒ SƠ");
  });
});

describe("Tinh huong 9 — Dieu bi ngat qua hai trang PDF", () => {
  const vanBan = [
    "Điều 10. Trình tự cấp giấy phép",
    "1. Trong thời hạn 15 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ, cơ quan",
    "3",
  ].join("\n") +
    "\n\f" +
    [
      "4",
      "có thẩm quyền phải cấp giấy phép cho tổ chức, cá nhân đề nghị.",
      "2. Trường hợp từ chối phải trả lời bằng văn bản và nêu rõ lý do.",
    ].join("\n") +
    "\n";
  const kq = parseVanBan(vanBan, { tenFile: "nd.pdf" });

  it("so trang o chan/dau trang khong bi hieu nham thanh Khoan", () => {
    expect(kq.chunks.map((c) => c.khoan_so)).toEqual([1, 2]);
  });

  it("cau bi ngat qua trang duoc noi lien mach", () => {
    expect(timChunk(kq.chunks, 10, 1).noi_dung).toContain(
      "cơ quan có thẩm quyền phải cấp giấy phép",
    );
  });

  it("ghi nhan dung vi tri trang cua tung chunk", () => {
    expect(timChunk(kq.chunks, 10, 1).vi_tri_trang).toBe(1);
    expect(timChunk(kq.chunks, 10, 2).vi_tri_trang).toBe(2);
    expect(kq.so_trang).toBe(2);
  });
});

describe("Tinh huong 10 — chu Dieu xuat hien giua cau", () => {
  const vanBan = `Điều 3. Nguyên tắc áp dụng
1. Việc cấp giấy phép thực hiện theo nguyên tắc công khai, minh bạch, đúng thẩm quyền quy định tại
Điều 5: khoản này không áp dụng đối với cơ sở nhỏ lẻ.
2. Cơ quan cấp phép chịu trách nhiệm trước pháp luật về quyết định của mình.
`;
  const kq = parseVanBan(vanBan, { tenFile: "nd.pdf" });

  it("khong tao Dieu moi tu tham chieu giua cau", () => {
    expect([...new Set(kq.chunks.map((c) => c.dieu_so))]).toEqual([3]);
  });

  it("giu tham chieu lai trong noi dung cua Khoan 1", () => {
    expect(timChunk(kq.chunks, 3, 1).noi_dung).toContain("Điều 5:");
  });
});

describe("Tinh huong 11 — danh so La Ma o Chuong", () => {
  const vanBan = ["I", "II", "III", "IV", "V", "X"]
    .map(
      (s, i) =>
        `Chương ${s}\nTIÊU ĐỀ CHƯƠNG ${s}\nĐiều ${i + 1}. Tiêu đề điều ${i + 1}\nNội dung của điều ${i + 1}.\n`,
    )
    .join("\n");
  const kq = parseVanBan(vanBan, { tenFile: "nd.pdf" });

  it("doc dung ca 6 chuong", () => {
    expect(kq.chunks.map((c) => c.chuong)).toEqual([
      "Chương I",
      "Chương II",
      "Chương III",
      "Chương IV",
      "Chương V",
      "Chương X",
    ]);
  });

  it("doi so La Ma sang so nguyen", () => {
    expect(soLaMaSangSo("IV")).toBe(4);
    expect(soLaMaSangSo("X")).toBe(10);
    expect(soLaMaSangSo("ABC")).toBeNull();
  });
});

describe("Tinh huong 12 — van ban sua doi, bo sung", () => {
  const vanBan = `Điều 1. Sửa đổi, bổ sung một số điều của Thông tư số 08/2023/TT-BTC
1. Sửa đổi, bổ sung Điều 12 như sau:
"Điều 12. Trách nhiệm của cơ quan thuế
Cơ quan thuế có trách nhiệm hướng dẫn người nộp thuế thực hiện Thông tư này."
2. Bãi bỏ khoản 3 Điều 15.

Điều 2. Hiệu lực thi hành
Thông tư này có hiệu lực thi hành kể từ ngày 01 tháng 7 năm 2023.
`;
  const kq = parseVanBan(vanBan, { tenFile: "tt-sua-doi.pdf" });

  it("chi co Dieu 1 va Dieu 2 cua chinh van ban sua doi", () => {
    expect([...new Set(kq.chunks.map((c) => c.dieu_so))]).toEqual([1, 2]);
  });

  it("Dieu duoc trich dan nam trong noi dung, khong thanh Dieu rieng", () => {
    const c = timChunk(kq.chunks, 1, 1);
    expect(c.noi_dung).toContain("Sửa đổi, bổ sung Điều 12 như sau:");
    expect(c.noi_dung).toContain('"Điều 12. Trách nhiệm của cơ quan thuế');
  });

  it("doc dung ngay hieu luc", () => {
    expect(kq.metadata.ngay_hieu_luc).toBe("2023-07-01");
  });
});

/* --- Quy tac cat chunk o muc 7.2 --- */

describe("Cat chunk khi vuot 800 token", () => {
  it("cat tiep theo tu khi mot cau don le van vuot nguong", () => {
    const cauRatDai = `${Array.from({ length: 851 }, (_, index) => `tu${index}`).join(" ")}.`;
    const kq = parseVanBan(`Điều 1. Nội dung\n1. ${cauRatDai}`);

    expect(kq.chunks.length).toBeGreaterThan(1);
    expect(kq.chunks.every((chunk) => chunk.so_token <= 800)).toBe(true);
    expect(kq.chunks.every((chunk) => chunk.bi_cat_cung)).toBe(true);
  });

  const doanDai = (tu: string, soTu: number) =>
    Array.from({ length: soTu }, () => tu).join(" ");

  it("Khoan qua dai thi cat tiep theo Diem", () => {
    const vanBan = `Điều 5. Điều kiện hoạt động
1. Tổ chức đề nghị cấp phép phải đáp ứng các điều kiện sau đây:
a) ${doanDai("điều", 400)}.
b) ${doanDai("kiện", 400)}.
c) ${doanDai("khác", 400)}.
`;
    const kq = parseVanBan(vanBan, { tenFile: "nd.pdf" });
    expect(kq.chunks.map((c) => c.diem)).toEqual(["a", "b", "c"]);
    for (const c of kq.chunks) {
      expect(c.khoan_so).toBe(1);
      expect(c.noi_dung).toContain("phải đáp ứng các điều kiện sau đây:");
      expect(c.bi_cat_cung).toBe(false);
    }
  });

  it("Khoan qua dai khong co Diem thi cat theo cau va danh co bi_cat_cung", () => {
    const cau = `Nội dung ${doanDai("chi tiết", 100)}.`;
    const vanBan = `Điều 5. Điều kiện hoạt động
1. ${cau} ${cau} ${cau} ${cau} ${cau}
`;
    const kq = parseVanBan(vanBan, { tenFile: "nd.pdf" });
    expect(kq.chunks.length).toBeGreaterThan(1);
    expect(kq.chunks.every((c) => c.bi_cat_cung)).toBe(true);
    expect(kq.chunks.every((c) => c.so_token <= 800)).toBe(true);
    expect(kq.canh_bao.some((c) => c.loai === "chunk_bi_cat_cung")).toBe(true);
  });
});

describe("Chuan hoa van ban", () => {
  it("dua ve NFC truoc khi chay regex", () => {
    // "Điều" viet bang to hop dau (NFD) phai duoc gom lai truoc khi khop regex.
    const nfd = "Điều 1. Phạm vi".normalize("NFD");
    expect(nfd).not.toBe("Điều 1. Phạm vi");
    const dong = chuanHoaVanBan(`${nfd}\nNội dung.`);
    const cauTruc = tachCauTruc(dong, 1);
    expect(cauTruc.dieu).toHaveLength(1);
    expect(cauTruc.dieu[0].tieu_de).toBe("Phạm vi");
  });

  it("bao canh bao khi khong nhan dang duoc Dieu nao", () => {
    const kq = parseVanBan("Một đoạn văn bản không có cấu trúc pháp lý nào cả.");
    expect(kq.canh_bao.some((c) => c.loai === "khong_co_dieu")).toBe(true);
  });
});

describe("D1 — doc_nodes ben vung va bang chu cai Diem", () => {
  it("tao cay day du, co depth va chunk structural tro toi node thap nhat", () => {
    const kq = parseVanBan(ND_15_2020, { tenFile: "nd-15-2020.pdf" });
    const diemB = kq.nodes.find((node) => node.key === "dieu:8/khoan:2/diem:b");

    expect(kq.nodes).toHaveLength(12);
    expect(diemB).toMatchObject({
      parent_key: "dieu:8/khoan:2",
      node_type: "diem",
      so_thu_tu: "b",
      breadcrumb: "Chương II > Mục 1 > Điều 8 > Khoản 2 > Điểm b",
      depth: 4,
    });
    expect(timChunk(kq.chunks, 8, 2).node_key).toBe("dieu:8/khoan:2");
    expect(timChunk(kq.chunks, 1).node_key).toBe("dieu:1");
  });

  it("xep chu đ ngay sau d va truoc e, khong bao nhay coc", () => {
    const kq = parseVanBan(`Điều 1. Phạm vi\n1. Các trường hợp gồm:\na) Mục a.\nb) Mục b.\nc) Mục c.\nd) Mục d.\nđ) Mục đ.\ne) Mục e.`);
    const diem = kq.nodes
      .filter((node) => node.node_type === "diem")
      .map((node) => node.so_thu_tu);

    expect(diem).toEqual(["a", "b", "c", "d", "đ", "e"]);
    expect(kq.canh_bao.some((warning) => warning.loai === "diem_khong_lien_tuc")).toBe(false);
  });
});
