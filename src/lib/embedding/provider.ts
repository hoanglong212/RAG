/** Mot nha cung cap vector hoa van ban. */
export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}

export const EMBEDDING_BATCH_SIZE = 50;

export function assertValidEmbeddings(
  embeddings: number[][],
  expectedCount: number,
  dimensions: number,
): void {
  if (embeddings.length !== expectedCount) {
    throw new Error(
      `Nhà cung cấp embedding trả ${embeddings.length} vector cho ${expectedCount} văn bản.`,
    );
  }
  embeddings.forEach((embedding, index) => {
    if (embedding.length !== dimensions) {
      throw new Error(
        `Vector thứ ${index + 1} có ${embedding.length} chiều; hệ thống yêu cầu ${dimensions}.`,
      );
    }
    if (!embedding.every(Number.isFinite)) {
      throw new Error(`Vector thứ ${index + 1} chứa giá trị không hữu hạn.`);
    }
  });
}

export async function createEmbeddingProvider(
  env: NodeJS.ProcessEnv = process.env,
): Promise<EmbeddingProvider> {
  const provider = env.EMBEDDING_PROVIDER?.trim().toLowerCase() || "hosted";
  if (provider === "local") {
    const { LocalEmbeddingProvider } = await import("./local");
    return LocalEmbeddingProvider.fromEnv(env);
  }
  if (provider !== "hosted") {
    throw new Error(
      `EMBEDDING_PROVIDER="${provider}" không được hỗ trợ; dùng "hosted" hoặc "local".`,
    );
  }
  const { HostedEmbeddingProvider } = await import("./hosted");
  return HostedEmbeddingProvider.fromEnv(env);
}
