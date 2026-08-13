import { afterEach, describe, expect, it } from "vitest";
import { buildGroundedPrompt, buildResearchSynthesisPrompt, readLlmConfig } from "./provider";

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

  it("chỉ dẫn LLM trả delta khi câu hỏi hỏi phần được sửa đổi", () => {
    const prompt = buildGroundedPrompt({
      question: "Nghị định 281/2026/NĐ-CP bổ sung gì vào khoản 3 Điều 4?",
      passages: [
        {
          index: 1,
          source: "281/2026/NĐ-CP > Điều 2 > Khoản 2",
          content: "Bổ sung các điểm p, q, r, s vào sau điểm o khoản 3 Điều 4.",
        },
      ],
    });
    expect(prompt).toContain("AMENDMENT_DELTA");
    expect(prompt).toContain("chỉ phần thay đổi");
    expect(prompt).toContain("không liệt kê lại nội dung không thay đổi");
  });

  it("chỉ dẫn LLM trả toàn bộ quy định khi hỏi nội dung hiện hành", () => {
    const prompt = buildGroundedPrompt({
      question: "Hiện nay khoản 3 Điều 4 quy định những biện pháp nào?",
      passages: [{ index: 1, source: "123/2024/NĐ-CP > Điều 4 > Khoản 3", content: "Nội dung." }],
    });
    expect(prompt).toContain("CURRENT_PROVISION");
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

  it("giữ loại nguồn trong prompt tổng hợp nghiên cứu sâu", () => {
    const prompt = buildResearchSynthesisPrompt({
      question: "Quy định này còn hiệu lực không?",
      sources: [{
        index: 1,
        source: "vbpl.vn — Nghị định 1/2025",
        sourceType: "Nguồn chính thức",
        content: "Có hiệu lực từ ngày 01/01/2025.",
      }],
    });
    expect(prompt).toContain("[1] [Nguồn chính thức] vbpl.vn — Nghị định 1/2025");
    expect(prompt).toContain("Quy định này còn hiệu lực không?");
  });
});
