import { describe, expect, it } from "vitest";
import type { EmbeddingProvider } from "../embedding/provider";
import { ingestDocument, type CompleteDocumentInput, type IngestStorage } from "./pipeline";

class MemoryStorage implements IngestStorage {
  completed: CompleteDocumentInput | null = null;
  failure: string | null = null;

  async createPending(): Promise<string> {
    return "document-1";
  }

  async complete(_documentId: string, input: CompleteDocumentInput): Promise<void> {
    this.completed = input;
  }

  async fail(_documentId: string, detail: string): Promise<void> {
    this.failure = detail;
  }
}

class RecordingEmbeddingProvider implements EmbeddingProvider {
  readonly name = "test";
  readonly dimensions = 2;
  readonly batchSizes: number[] = [];

  async embed(texts: string[]): Promise<number[][]> {
    this.batchSizes.push(texts.length);
    return texts.map((_, index) => [index, index + 1]);
  }
}

describe("ingestDocument", () => {
  it("embed theo lo toi da 50 va hoan tat mot document", async () => {
    const storage = new MemoryStorage();
    const embeddingProvider = new RecordingEmbeddingProvider();
    const text = Array.from(
      { length: 51 },
      (_, index) => `Điều ${index + 1}. Tiêu đề ${index + 1}\nNội dung điều ${index + 1}.`,
    ).join("\n");

    const result = await ingestDocument(
      { fileName: "van-ban.txt", data: new Uint8Array() },
      {
        storage,
        embeddingProvider,
        extract: async () => ({ text, warnings: [] }),
      },
    );

    expect(result.chunkCount).toBe(51);
    expect(embeddingProvider.batchSizes).toEqual([50, 1]);
    expect(storage.completed?.chunks).toHaveLength(51);
    expect(storage.completed?.nodes.filter((node) => node.node_type === "dieu")).toHaveLength(51);
    expect(storage.completed?.chunks.every((chunk) => chunk.node_key !== null)).toBe(true);
    expect(storage.completed?.strategy).toBe("structural");
    expect(storage.failure).toBeNull();
  });

  it("ghi trang thai loi nhung van nem loi cho caller xu ly file ke tiep", async () => {
    const storage = new MemoryStorage();
    const embeddingProvider = new RecordingEmbeddingProvider();

    await expect(
      ingestDocument(
        { fileName: "scan.pdf", data: new Uint8Array() },
        {
          storage,
          embeddingProvider,
          extract: async () => {
            throw new Error("PDF không có text layer");
          },
        },
      ),
    ).rejects.toMatchObject({ documentId: "document-1" });
    expect(storage.failure).toBe("PDF không có text layer");
    expect(storage.completed).toBeNull();
  });
});
