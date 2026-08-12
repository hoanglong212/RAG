import { describe, expect, it } from "vitest";
import { buildMissingFacts, buildNextSteps } from "./case-guidance";

describe("case guidance", () => {
  it("hỏi thêm dữ kiện đúng chủ đề lao động mà không lặp", () => {
    const facts = buildMissingFacts("Công ty chậm trả lương", ["lao_dong", "lao_dong"]);
    expect(facts).toContain("Loại hợp đồng, kỳ trả lương và số tiền còn thiếu");
    expect(new Set(facts).size).toBe(facts.length);
  });

  it("không khuyên dùng kết quả khi chưa có căn cứ", () => {
    expect(buildNextSteps(false)).toContain("Không sử dụng kết quả hiện tại làm kết luận pháp lý");
  });
});
