import { describe, expect, it } from "vitest";
import type { EmbeddingProvider } from "../embedding/provider";
import {
  assertUsableExtractedText,
  ingestDocument,
  type CompleteDocumentInput,
  type IngestStorage,
} from "./pipeline";

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

    expect(result.chunkCount).toBe(52);
    expect(embeddingProvider.batchSizes).toEqual([50, 2]);
    expect(storage.completed?.chunks).toHaveLength(52);
    expect(storage.completed?.nodes.filter((node) => node.node_type === "dieu")).toHaveLength(51);
    expect(storage.completed?.legalTopics).toEqual([]);
    expect(
      storage.completed?.chunks.filter((chunk) => chunk.strategy === "structural"),
    ).toHaveLength(51);
    expect(storage.completed?.chunks.find((chunk) => chunk.strategy === "fixed")?.node_key).toBeNull();
    expect(storage.failure).toBeNull();
  });

  it("gắn chủ đề pháp lý khi ingest văn bản mới", async () => {
    const storage = new MemoryStorage();
    const text = "Điều 1. Phạm vi\nQuy định xử phạt người điều khiển xe máy vượt đèn đỏ.";
    await ingestDocument(
      { fileName: "nghi-dinh-giao-thong.txt", data: new Uint8Array() },
      { storage, embeddingProvider: new RecordingEmbeddingProvider(), extract: async () => ({ text, warnings: [] }) },
    );
    expect(storage.completed?.legalTopics).toContain("giao_thong");
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

  it("tu choi ban chuyen doi tu scan chi chua thong tin chu ky so", async () => {
    const storage = new MemoryStorage();
    const embeddingProvider = new RecordingEmbeddingProvider();
    const text = `Người ký: CỔNG THÔNG TIN ĐIỆN TỬ CHÍNH PHỦ

Email: thongtinchinhphu@chinhphu.vn Cơ quan: VĂN PHÒNG CHÍNH PHỦ Thời gian ký: 02.01.2025 16:29:02 +07:00`;

    await expect(
      ingestDocument(
        { fileName: "van-ban-scan.docx", data: new Uint8Array() },
        {
          storage,
          embeddingProvider,
          extract: async () => ({ text, warnings: [] }),
        },
      ),
    ).rejects.toMatchObject({
      documentId: "document-1",
      message: expect.stringContaining("chỉ chứa thông tin chữ ký số"),
    });
    expect(storage.failure).toContain("chỉ chứa thông tin chữ ký số");
    expect(storage.completed).toBeNull();
    expect(embeddingProvider.batchSizes).toEqual([]);
  });

  it("khong tu choi van ban co noi dung that sau khoi chu ky so", () => {
    expect(() =>
      assertUsableExtractedText(`Người ký: CỔNG THÔNG TIN ĐIỆN TỬ CHÍNH PHỦ
Thời gian ký: 02.01.2025 16:29:02 +07:00
Điều 1. Phạm vi điều chỉnh
Nghị định này quy định về trật tự, an toàn giao thông đường bộ.`),
    ).not.toThrow();
  });

  it("van nap fixed chunk khi van ban khong co cau truc Dieu", async () => {
    const storage = new MemoryStorage();
    const embeddingProvider = new RecordingEmbeddingProvider();
    const text = "CÔNG VĂN\nNội dung chỉ đạo không chia thành điều khoản.";

    const result = await ingestDocument(
      { fileName: "cong-van.txt", data: new Uint8Array() },
      { storage, embeddingProvider, extract: async () => ({ text, warnings: [] }) },
    );

    expect(result.chunkCount).toBe(1);
    expect(storage.completed?.chunks[0]).toMatchObject({ strategy: "fixed", node_key: null });
    expect(storage.completed?.nodes).toHaveLength(0);
  });
});
