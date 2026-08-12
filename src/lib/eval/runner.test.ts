import { describe, expect, it } from "vitest";
import rawGoldSet from "../../../data/eval/cau-hoi.json";
import {
  calculateMetrics,
  parseGoldSet,
  resolveGoldChunks,
  type GoldChunkRow,
} from "./runner";

describe("gold eval set", () => {
  it("giữ đúng phân bố 15/15/10 và không trùng câu", () => {
    const parsed = parseGoldSet(rawGoldSet);
    expect(parsed.questions).toHaveLength(40);
    expect(parsed.questions.filter((item) => item.group === "direct")).toHaveLength(15);
    expect(parsed.questions.filter((item) => item.group === "paraphrase")).toHaveLength(15);
    expect(parsed.questions.filter((item) => item.group === "identifier")).toHaveLength(10);
  });

  it("ánh xạ cùng đáp án sang chunk của từng chiến lược", () => {
    const gold = parseGoldSet({
      schemaVersion: 1,
      description: "test",
      questions: [
        ...Array.from({ length: 15 }, (_, index) => question(`D${index}`, "direct")),
        ...Array.from({ length: 15 }, (_, index) => question(`P${index}`, "paraphrase")),
        ...Array.from({ length: 10 }, (_, index) => question(`I${index}`, "identifier", true)),
      ],
    });
    const rows: GoldChunkRow[] = [
      row("fixed-id", "fixed", null, null),
      row("structural-id", "structural", 2, 3),
    ];
    const resolved = resolveGoldChunks(gold, rows);
    expect(resolved.fixed.get("D0")).toEqual(["fixed-id"]);
    expect(resolved.structural.get("D0")).toEqual(["structural-id"]);
  });
});

describe("calculateMetrics", () => {
  it("tính Recall@5, Recall@10 và MRR theo hit đầu tiên", () => {
    const q1 = question("D1", "direct");
    const q2 = question("D2", "direct");
    const metrics = calculateMetrics(
      [
        { question: q1, chunkIds: ["wrong", "gold-1"] },
        { question: q2, chunkIds: ["1", "2", "3", "4", "5", "gold-2"] },
      ],
      new Map([
        ["D1", ["gold-1"]],
        ["D2", ["gold-2"]],
      ]),
    );
    expect(metrics).toEqual({ recallAt5: 0.5, recallAt10: 1, mrr: 1 / 3, nQuestions: 2 });
  });
});

function question(id: string, group: "direct" | "paraphrase" | "identifier", identifier = false) {
  return {
    id,
    group,
    question: identifier ? `Theo VB/01, câu ${id}?` : `Câu hỏi ${id}?`,
    source: { soHieu: "VB/01", dieu: 2, khoan: 3 },
    answerText: "Nội dung đáp án.",
  };
}

function row(
  id: string,
  strategy: "fixed" | "structural",
  dieu: number | null,
  khoan: number | null,
): GoldChunkRow {
  return {
    id,
    strategy,
    so_hieu: "VB/01",
    dieu_so: dieu,
    khoan_so: khoan,
    diem: null,
    noi_dung: "Mở đầu. Nội dung đáp án. Kết thúc.",
  };
}
