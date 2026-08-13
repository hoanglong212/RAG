import { describe, expect, it } from "vitest";
import {
  rerankForLegalIntent,
  understandLegalQuery,
} from "./query-understanding";
import type { RetrievalResult } from "./vector";

function result(
  chunkId: string,
  soHieu: string,
  breadcrumb: string,
  content: string,
  score = 0.7,
): RetrievalResult {
  return {
    chunkId,
    documentId: `document-${chunkId}`,
    nodeId: `node-${chunkId}`,
    soHieu,
    breadcrumb,
    content,
    score,
    rrfScore: 0.02,
  };
}

describe("legal query understanding", () => {
  it("phân biệt văn bản sửa đổi và văn bản đích trong câu hỏi ADD", () => {
    expect(
      understandLegalQuery(
        "Nghị định 281/2026/NĐ-CP bổ sung những biện pháp nào vào khoản 3 Điều 4 của Nghị định 123/2024/NĐ-CP?",
      ),
    ).toMatchObject({
      intent: "amendment_delta",
      operation: "add",
      amendingIdentifier: "281/2026/NĐ-CP",
      targetIdentifier: "123/2024/NĐ-CP",
      locator: { dieu: 4, khoan: 3, diem: null },
    });
  });

  it.each([
    ["Nghị định X sửa đổi điểm b khoản 2 Điều 10 như thế nào?", "amend"],
    ["Nghị định X bãi bỏ những nội dung nào của Nghị định Y?", "repeal"],
    ["Cụm từ nào được thay thế tại Điều 15?", "replace"],
    ["Điểm mới của Nghị định X đối với Điều 4 là gì?", "delta"],
  ] as const)("nhận diện operation của: %s", (question, operation) => {
    expect(understandLegalQuery(question)).toMatchObject({
      intent: "amendment_delta",
      operation,
    });
  });

  it("coi 'sửa đổi, bổ sung' là delta hỗn hợp thay vì ADD thuần", () => {
    expect(understandLegalQuery("Nghị định X sửa đổi, bổ sung Điều 4 như thế nào?")).toMatchObject({
      intent: "amendment_delta",
      operation: "delta",
    });
  });

  it("nhận diện cách viết thay cụm từ ... bằng ...", () => {
    expect(understandLegalQuery("Thay cụm từ cũ bằng cụm từ mới tại Điều 15")).toMatchObject({
      intent: "amendment_delta",
      operation: "replace",
    });
  });

  it("không nhầm yêu cầu nội dung hiện hành với yêu cầu delta", () => {
    expect(
      understandLegalQuery(
        "Hiện nay khoản 3 Điều 4 sau khi được sửa đổi, bổ sung gồm những biện pháp nào?",
      ),
    ).toMatchObject({ intent: "current_provision" });
  });
});

describe("amendment-aware reranking", () => {
  it("đưa phần ADD của văn bản sửa đổi lên trên toàn bộ điều khoản gốc", () => {
    const question =
      "Nghị định bổ sung những biện pháp khắc phục hậu quả nào tại khoản 3 Điều 4 của Nghị định 123/2024/NĐ-CP?";
    const ranked = rerankForLegalIntent(question, [
      result(
        "base",
        "123/2024/NĐ-CP",
        "Nghị định 123/2024/NĐ-CP > Điều 4 > Khoản 3",
        "Biện pháp khắc phục hậu quả gồm các điểm a, b, c đến o.",
        0.9,
      ),
      result(
        "unrelated-amendment",
        "124/2021/NĐ-CP",
        "Nghị định 124/2021/NĐ-CP > Điều 1 > Khoản 1",
        "Bổ sung điểm m vào khoản 3 Điều 2.",
        0.8,
      ),
      result(
        "amendment",
        "281/2026/NĐ-CP",
        "Nghị định 281/2026/NĐ-CP > Điều 2 > Khoản 2",
        "Bổ sung các điểm p, q, r, s vào sau điểm o khoản 3 Điều 4: p) Nội dung p; q) Nội dung q; r) Nội dung r; s) Nội dung s.",
        0.65,
      ),
    ]);

    expect(ranked.map((item) => item.chunkId)).toEqual([
      "amendment",
      "unrelated-amendment",
      "base",
    ]);
  });

  it("ưu tiên đúng AMEND, REPEAL và REPLACE thay vì cả điều gốc", () => {
    const cases = [
      {
        question: "Nghị định X sửa đổi điểm b khoản 2 Điều 10 như thế nào?",
        delta: "Sửa đổi điểm b khoản 2 Điều 10 như sau: b) Nội dung mới.",
        base: "Điều 10 gồm toàn bộ các khoản và điểm đang có.",
      },
      {
        question: "Nghị định X bãi bỏ những nội dung nào tại Điều 10?",
        delta: "Bãi bỏ điểm b khoản 2 Điều 10.",
        base: "Điều 10 gồm toàn bộ các khoản và điểm đang có.",
      },
      {
        question: "Cụm từ nào được thay thế tại Điều 15?",
        delta: "Thay thế cụm từ “cũ” bằng cụm từ “mới” tại Điều 15.",
        base: "Điều 15 quy định toàn bộ nội dung hiện hành.",
      },
    ];

    for (const item of cases) {
      const ranked = rerankForLegalIntent(item.question, [
        result("base", "Y", "Điều gốc", item.base, 0.9),
        result("delta", "X", "Văn bản sửa đổi", item.delta, 0.6),
      ]);
      expect(ranked[0]?.chunkId).toBe("delta");
    }
  });

  it("giữ điều khoản hiện hành ở trên khi người dùng hỏi toàn văn hiện nay", () => {
    const question = "Hiện nay khoản 3 Điều 4 quy định những biện pháp nào?";
    const ranked = rerankForLegalIntent(question, [
      result("base", "123/2024/NĐ-CP", "Điều 4 > Khoản 3", "Toàn bộ nội dung hiện hành.", 0.9),
      result("delta", "281/2026/NĐ-CP", "Điều 2 > Khoản 2", "Bổ sung điểm p, q, r, s.", 0.6),
    ]);
    expect(ranked[0]?.chunkId).toBe("base");
  });
});
