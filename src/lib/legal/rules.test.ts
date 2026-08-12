import { describe, expect, it } from "vitest";
import { matchViolationRules } from "./rules";

describe("violation rules", () => {
  it("ghim đúng Điều 6 Khoản 1 cho hóa chất quá hạn", () => {
    expect(matchViolationRules("Cơ sở sử dụng hóa chất đã quá hạn để chế biến thực phẩm")).toEqual([
      expect.objectContaining({
        id: "expired-chemical",
        source: { soHieu: "115/2018/NĐ-CP", dieu: 6, khoan: 1 },
      }),
    ]);
  });

  it("không ép rule khi tình huống chỉ nói chung về hóa chất", () => {
    expect(matchViolationRules("Cơ sở mua hóa chất vệ sinh mới")).toEqual([]);
  });

  it("nhận diện hành vi đưa tạp chất vào thủy sản", () => {
    expect(matchViolationRules("Doanh nghiệp trực tiếp trộn tạp chất vào thủy sản")[0]?.id).toBe(
      "seafood-adulterant",
    );
  });
  it.each([
    ["Công ty chậm trả tiền lương cho người lao động", "late-or-unpaid-wages"],
    ["Người đi xe máy vượt đèn đỏ", "motorbike-red-light"],
    ["Người đi xe máy không đội mũ bảo hiểm", "motorbike-no-helmet"],
    ["Hộ gia đình lấn đất công", "land-encroachment"],
    ["Cửa hàng từ chối bảo hành sản phẩm lỗi", "consumer-warranty"],
  ])("nhận diện rule đa lĩnh vực: %s", (scenario, expectedRule) => {
    expect(matchViolationRules(scenario).map((item) => item.id)).toContain(expectedRule);
  });
});
