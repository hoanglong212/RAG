import { z } from "zod";
import { assertValidEmbeddings, type EmbeddingProvider } from "./provider";

const localResponseSchema = z.object({
  embeddings: z.array(z.array(z.number())),
});

type FetchLike = typeof fetch;

/** EmbeddingProvider goi service FastAPI self-host, khong gui du lieu ra API ben thu ba. */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  readonly name: string;

  constructor(
    private readonly baseUrl: string,
    readonly dimensions: number,
    modelName: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    this.name = `local:${modelName}`;
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): LocalEmbeddingProvider {
    const baseUrl = env.LOCAL_EMBEDDING_URL?.trim() || "http://127.0.0.1:8000";
    const dimensions = Number(env.EMBEDDING_DIM ?? 768);
    const modelName =
      env.EMBEDDING_MODEL?.trim() || "bkai-foundation-models/vietnamese-bi-encoder";
    try {
      new URL(baseUrl);
    } catch {
      throw new Error("LOCAL_EMBEDDING_URL không phải URL hợp lệ.");
    }
    if (!Number.isInteger(dimensions) || dimensions <= 0) {
      throw new Error("EMBEDDING_DIM phải là số nguyên dương.");
    }
    return new LocalEmbeddingProvider(baseUrl.replace(/\/$/, ""), dimensions, modelName);
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.some((text) => text.trim() === "")) {
      throw new Error("Không thể tạo embedding cho văn bản rỗng.");
    }
    const response = await this.fetchImpl(`${this.baseUrl}/embed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texts }),
      signal: AbortSignal.timeout(180_000),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Dịch vụ embedding local trả HTTP ${response.status}.`);
    }
    const parsed = localResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error("Dịch vụ embedding local trả dữ liệu không đúng định dạng.");
    }
    assertValidEmbeddings(parsed.data.embeddings, texts.length, this.dimensions);
    return parsed.data.embeddings;
  }
}
