import { describe, expect, it } from "vitest";
import { buildGroundedPrompt } from "./provider";

describe("grounded LLM prompt", () => {
  it("đánh số và giữ nguồn cạnh đúng ngữ cảnh", () => {
    const prompt = buildGroundedPrompt({
      question: "Mức phạt tối đa là bao nhiêu?",
      passages: [{ index: 1, source: "115/2018/NĐ-CP > Điều 3", content: "100 triệu đồng" }],
    });
    expect(prompt).toContain("CÂU HỎI:\nMức phạt tối đa là bao nhiêu?");
    expect(prompt).toContain("[1] 115/2018/NĐ-CP > Điều 3\n100 triệu đồng");
  });
});
