import type { ChatRequest } from "../../types/contract";
import { createEmbeddingProvider, type EmbeddingProvider } from "../embedding/provider";
import type { ChunkStrategy } from "../db/schema";
import { hybridSearch } from "./hybrid";
import { vectorSearch, type RetrievalResult } from "./vector";

export interface SearchOptions {
  mode?: NonNullable<ChatRequest["mode"]>;
  strategy?: ChunkStrategy;
  topK?: number;
  candidateK?: number;
  lexicalWeight?: number;
  legalTopics?: string[];
}

export async function timKiem(
  question: string,
  options: SearchOptions = {},
  embeddingProvider?: EmbeddingProvider,
): Promise<RetrievalResult[]> {
  const cleanQuestion = question.trim();
  if (cleanQuestion === "") throw new Error("Câu hỏi không được để trống.");
  const topK = options.topK ?? 5;
  if (!Number.isInteger(topK) || topK < 1 || topK > 50) {
    throw new Error("topK phải là số nguyên từ 1 đến 50.");
  }
  const mode = options.mode ?? "hybrid";
  if (mode === "hybrid_rerank") {
    throw new Error("Mode hybrid_rerank chưa được hiện thực; đây là thí nghiệm E4 tùy chọn.");
  }
  const strategy = options.strategy ?? "structural";
  const [{ sql }, provider] = await Promise.all([
    import("../db/client"),
    embeddingProvider ? Promise.resolve(embeddingProvider) : createEmbeddingProvider(),
  ]);

  if (mode === "vector") {
    return vectorSearch(
      cleanQuestion,
      { topK, strategy, legalTopics: options.legalTopics },
      { sql, embeddingProvider: provider },
    );
  }
  return hybridSearch(
    cleanQuestion,
    {
      topK,
      strategy,
      candidateK: options.candidateK,
      lexicalWeight: options.lexicalWeight,
      legalTopics: options.legalTopics,
    },
    { sql, embeddingProvider: provider },
  );
}

export type { RetrievalResult } from "./vector";
