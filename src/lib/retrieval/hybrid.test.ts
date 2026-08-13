import { describe, expect, it } from "vitest";
import { buildTsQuery, extractLegalIdentifier, extractLegalLocator } from "./fulltext";
import {
  lexicalWeightForQuestion,
  reciprocalRankFusion,
  resolveHybridCandidateK,
} from "./hybrid";
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
    expect(buildTsQuery(question)).toContain("muc:*");
    expect(buildTsQuery(question)).toContain("toi:*");
    expect(buildTsQuery(question)).not.toContain("bao:*");
  });

  it("không loại bỏ các từ mang nghĩa sửa đổi pháp lý", () => {
    const query = buildTsQuery("bổ sung sửa đổi bãi bỏ thay thế điểm mới hiện nay");
    for (const term of ["bo:*", "sung:*", "sua:*", "doi:*", "bai:*", "thay:*", "moi:*", "hien:*"]) {
      expect(query).toContain(term);
    }
  });

  it("tách Điều, Khoản, Điểm để boost đúng node thay vì toàn văn bản", () => {
    expect(extractLegalLocator("Theo điểm i khoản 12 Điều 1 Nghị định 124/2021/NĐ-CP")).toEqual({
      dieu: 1,
      khoan: 12,
      diem: "i",
    });
  });

  it("cho phép full-text bổ sung mà không lấn át trục vector", () => {
    const vector = [result("vector-top", 0.9), result("shared", 0.8)];
    const fulltext = [result("lexical-only", 0.9), result("shared", 0.8)];
    const fused = reciprocalRankFusion([vector, fulltext], 3, 60, [1, 0.2]);
    expect(fused.map((item) => item.chunkId)).toEqual(["shared", "vector-top", "lexical-only"]);
  });

  it("tăng trọng số lexical khi câu hỏi có số hiệu pháp lý chính xác", () => {
    expect(lexicalWeightForQuestion("Mức phạt là bao nhiêu?")).toBe(0.05);
    expect(lexicalWeightForQuestion("Theo 115/2018/NĐ-CP, mức phạt là bao nhiêu?")).toBe(0.2);
    expect(lexicalWeightForQuestion("Theo Điều 12 Nghị định 115/2018/NĐ-CP?")).toBe(1);
  });

  it("giữ candidate pool mặc định giống nhau giữa API topK=5 và eval topK=10", () => {
    expect(resolveHybridCandidateK(5)).toBe(40);
    expect(resolveHybridCandidateK(10)).toBe(40);
    expect(resolveHybridCandidateK(50)).toBe(50);
    expect(resolveHybridCandidateK(5, 80)).toBe(80);
  });
});
