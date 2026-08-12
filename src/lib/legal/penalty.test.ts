import { describe, expect, it } from "vitest";
import { parsePenaltyRange } from "./penalty";

describe("parsePenaltyRange", () => {
  it("đọc đúng khoảng tiền phạt tiếng Việt", () => {
    expect(parsePenaltyRange("Phạt tiền từ 4.000.000 đồng đến 6.000.000 đồng đối với hành vi")).toEqual({
      from: 4_000_000,
      to: 6_000_000,
    });
  });

  it("không tự tạo mức tiền khi căn cứ không chứa khoảng phạt", () => {
    expect(parsePenaltyRange("Người bán có trách nhiệm bảo hành sản phẩm.")).toBeNull();
  });
});
