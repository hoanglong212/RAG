import { describe, expect, it } from "vitest";
import { createFixedChunks, FIXED_CHUNK_TOKENS } from "./fixed";

describe("createFixedChunks", () => {
  it("cat baseline moi 512 token va khong gan node cau truc", () => {
    const text = Array.from({ length: FIXED_CHUNK_TOKENS + 3 }, (_, index) => `tu${index}`).join(" ");
    const chunks = createFixedChunks(text, "55/2010/QH12");

    expect(chunks).toHaveLength(2);
    expect(chunks.map((chunk) => chunk.so_token)).toEqual([512, 3]);
    expect(chunks.every((chunk) => chunk.node_key === null)).toBe(true);
    expect(chunks[0].duong_dan).toBe("55/2010/QH12 > Khối cố định 1");
  });
});
