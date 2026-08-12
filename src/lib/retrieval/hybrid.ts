import type postgres from "postgres";
import type { EmbeddingProvider } from "../embedding/provider";
import type { ChunkStrategy } from "../db/schema";
import { extractLegalIdentifier } from "./fulltext";
import { fulltextSearch } from "./fulltext";
import { vectorSearch, type RetrievalResult } from "./vector";

export const RRF_K = 60;

export function lexicalWeightForQuestion(question: string): number {
  // Số hiệu là tín hiệu lexical có độ tin cậy cao; OR-query tiếng Việt thông thường thì nhiễu hơn.
  return extractLegalIdentifier(question) === null ? 0.05 : 0.2;
}

/** Pure RRF để phép trộn có thể kiểm thử độc lập với DB/model. */
export function reciprocalRankFusion(
  rankings: RetrievalResult[][],
  topK: number,
  k = RRF_K,
  weights: number[] = rankings.map(() => 1),
): RetrievalResult[] {
  const fused = new Map<string, RetrievalResult>();

  for (const [rankingIndex, ranking] of rankings.entries()) {
    const weight = weights[rankingIndex] ?? 1;
    ranking.forEach((result, index) => {
      const current = fused.get(result.chunkId);
      const rrfScore = (current?.rrfScore ?? 0) + weight / (k + index + 1);
      fused.set(result.chunkId, {
        ...(current ?? result),
        vectorScore: result.vectorScore ?? current?.vectorScore,
        fulltextScore: result.fulltextScore ?? current?.fulltextScore,
        rrfScore,
        score: Math.max(
          current?.score ?? 0,
          result.score,
          result.vectorScore ?? 0,
          result.fulltextScore ?? 0,
        ),
      });
    });
  }

  return [...fused.values()]
    .sort((left, right) =>
      (right.rrfScore ?? 0) - (left.rrfScore ?? 0) || right.score - left.score,
    )
    .slice(0, topK);
}

export async function hybridSearch(
  question: string,
  options: { topK: number; strategy: ChunkStrategy; candidateK?: number },
  dependencies: { sql: postgres.Sql; embeddingProvider: EmbeddingProvider },
): Promise<RetrievalResult[]> {
  const candidateK = Math.max(options.topK, options.candidateK ?? options.topK * 4);
  const [vectorResults, fulltextResults] = await Promise.all([
    vectorSearch(
      question,
      { topK: candidateK, strategy: options.strategy },
      dependencies,
    ),
    fulltextSearch(question, { topK: candidateK, strategy: options.strategy }, dependencies.sql),
  ]);
  // Vector là trục ổn định; full-text là tín hiệu bổ sung có trọng số theo loại câu hỏi.
  return reciprocalRankFusion(
    [vectorResults, fulltextResults],
    options.topK,
    RRF_K,
    [1, lexicalWeightForQuestion(question)],
  );
}
