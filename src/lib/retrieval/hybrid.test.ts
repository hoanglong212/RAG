import { describe, expect, it } from "vitest";
import { buildTsQuery, extractLegalIdentifier } from "./fulltext";
import { reciprocalRankFusion } from "./hybrid";
import type { RetrievalResult } from "./vector";

function result(chunkId: string, score: number): RetrievalResult {
  return {
    chunkId,
    documentId: "document",
    nodeId: "node",
    soHieu: "115/2018/NĐ-CP",
    breadcrumb: "Điều 1",
    content: "Nội dung",
    score,
  };
}

describe("hybrid retrieval", () => {
  it("trộn hai bảng xếp hạng bằng RRF k=60", () => {
    const vector = [result("a", 0.8), result("b", 0.7)];
    vector.forEach((item) => (item.vectorScore = item.score));
    const fulltext = [result("b", 1), result("c", 0.4)];
    fulltext.forEach((item) => (item.fulltextScore = item.score));

    const fused = reciprocalRankFusion([vector, fulltext], 3);
    expect(fused.map((item) => item.chunkId)).toEqual(["b", "a", "c"]);
    expect(fused[0].rrfScore).toBeCloseTo(1 / 62 + 1 / 61);
    expect(fused[0].score).toBe(1);
  });

  it("tách số hiệu và tạo OR-query đã bỏ dấu", () => {
    const question = "Nghị định 115/2018/NĐ-CP quy định mức phạt tối đa bao nhiêu?";
    expect(extractLegalIdentifier(question)).toBe("115/2018/NĐ-CP");
    expect(buildTsQuery(question)).toContain("115:*");
    expect(buildTsQuery(question)).toContain("phat:*");
    expect(buildTsQuery(question)).not.toContain("bao:*");
  });
});
