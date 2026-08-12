import { afterEach, describe, expect, it } from "vitest";
import { buildGroundedPrompt, readLlmConfig } from "./provider";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
});

describe("grounded LLM prompt", () => {
  it("đánh số và giữ nguồn cạnh đúng ngữ cảnh", () => {
    const prompt = buildGroundedPrompt({
      question: "Mức phạt tối đa là bao nhiêu?",
      passages: [{ index: 1, source: "115/2018/NĐ-CP > Điều 3", content: "100 triệu đồng" }],
    });
    expect(prompt).toContain("CÂU HỎI:\nMức phạt tối đa là bao nhiêu?");
    expect(prompt).toContain("[1] 115/2018/NĐ-CP > Điều 3\n100 triệu đồng");
  });

  it("tự cấu hình endpoint và model production khi có GROQ_API_KEY", () => {
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_API_URL;
    delete process.env.LLM_MODEL;
    process.env.GROQ_API_KEY = "gsk_test";
    expect(readLlmConfig()).toEqual({
      apiKey: "gsk_test",
      apiUrl: "https://api.groq.com/openai/v1/chat/completions",
      model: "llama-3.3-70b-versatile",
    });
  });
});
