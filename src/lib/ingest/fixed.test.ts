import { describe, expect, it } from "vitest";
import {
  buildFixedCorpusText,
  createFixedChunks,
  FIXED_CHUNK_OVERLAP,
  FIXED_CHUNK_TOKENS,
} from "./fixed";
import type { DocNodeParse } from "../parser";

describe("createFixedChunks", () => {
  it("cat baseline 512 token, overlap 64 va khong gan node cau truc", () => {
    const text = Array.from({ length: FIXED_CHUNK_TOKENS + 3 }, (_, index) => `tu${index}`).join(" ");
    const chunks = createFixedChunks(text, "55/2010/QH12");

    expect(chunks).toHaveLength(2);
    expect(chunks.map((chunk) => chunk.so_token)).toEqual([
      FIXED_CHUNK_TOKENS,
      FIXED_CHUNK_OVERLAP + 3,
    ]);
    const firstWords = chunks[0].noi_dung.split(" ");
    const secondWords = chunks[1].noi_dung.split(" ");
    expect(firstWords.slice(-FIXED_CHUNK_OVERLAP)).toEqual(
      secondWords.slice(0, FIXED_CHUNK_OVERLAP),
    );
    expect(chunks.every((chunk) => chunk.node_key === null)).toBe(true);
    expect(chunks[0].duong_dan).toBe("55/2010/QH12 > Khối cố định 1");
  });

  it("tu choi overlap khong nho hon kich thuoc chunk", () => {
    expect(() => createFixedChunks("mot hai ba", "Mẫu", 3, 3)).toThrow(
      "Overlap fixed chunk phai tu 0 den nho hon kich thuoc chunk.",
    );
  });

  it("dung corpus canonical theo thu tu node va khong lay phan dau ngoai cau truc", () => {
    const nodes: DocNodeParse[] = [
      {
        key: "dieu:1/khoan:1",
        parent_key: "dieu:1",
        node_type: "khoan",
        so_thu_tu: "1",
        tieu_de: null,
        noi_dung: "Nội dung khoản.",
        breadcrumb: "Điều 1 > Khoản 1",
        order_index: 1,
        depth: 1,
      },
      {
        key: "dieu:1",
        parent_key: null,
        node_type: "dieu",
        so_thu_tu: "1",
        tieu_de: "Phạm vi",
        noi_dung: "Nội dung mở đầu.",
        breadcrumb: "Điều 1",
        order_index: 0,
        depth: 0,
      },
    ];

    expect(buildFixedCorpusText(nodes)).toBe(
      "Điều 1. Phạm vi\nNội dung mở đầu.\n1.\nNội dung khoản.",
    );
  });
});
