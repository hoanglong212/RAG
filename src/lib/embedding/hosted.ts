import { z } from "zod";
import { assertValidEmbeddings, type EmbeddingProvider } from "./provider";

const embeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      embedding: z.array(z.number()),
      index: z.number().int().nonnegative(),
    }),
  ),
});

const errorResponseSchema = z.object({
  error: z.object({ message: z.string() }),
});

export interface HostedEmbeddingConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  dimensions: number;
}

type FetchLike = typeof fetch;

/** Adapter cho API embedding co giao thuc tuong thich OpenAI. */
export class HostedEmbeddingProvider implements EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;

  constructor(
    private readonly config: HostedEmbeddingConfig,
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    this.name = `hosted:${config.model}`;
    this.dimensions = config.dimensions;
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): HostedEmbeddingProvider {
    const apiKey = env.EMBEDDING_API_KEY?.trim();
    const model = env.EMBEDDING_MODEL?.trim();
    const apiUrl =
      env.EMBEDDING_API_URL?.trim() || "https://api.openai.com/v1/embeddings";
    const dimensions = Number(env.EMBEDDING_DIM ?? 768);

    if (!apiKey) throw new Error("Thiếu biến môi trường EMBEDDING_API_KEY.");
    if (!model) throw new Error("Thiếu biến môi trường EMBEDDING_MODEL.");
    if (!Number.isInteger(dimensions) || dimensions <= 0) {
      throw new Error("EMBEDDING_DIM phải là số nguyên dương.");
    }
    try {
      new URL(apiUrl);
    } catch {
      throw new Error("EMBEDDING_API_URL không phải URL hợp lệ.");
    }

    return new HostedEmbeddingProvider({ apiKey, apiUrl, model, dimensions });
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.some((text) => text.trim() === "")) {
      throw new Error("Không thể tạo embedding cho văn bản rỗng.");
    }

    const response = await this.fetchImpl(this.config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: texts,
        model: this.config.model,
        dimensions: this.config.dimensions,
        encoding_format: "float",
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsedError = errorResponseSchema.safeParse(payload);
      const detail = parsedError.success
        ? parsedError.data.error.message.slice(0, 500)
        : `HTTP ${response.status}`;
      throw new Error(`Dịch vụ embedding từ chối yêu cầu: ${detail}`);
    }

    const parsed = embeddingResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error("Dịch vụ embedding trả dữ liệu không đúng định dạng.");
    }

    const ordered = [...parsed.data.data]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
    assertValidEmbeddings(ordered, texts.length, this.dimensions);
    return ordered;
  }
}
