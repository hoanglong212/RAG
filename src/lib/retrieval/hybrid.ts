import type postgres from "postgres";
import type { EmbeddingProvider } from "../embedding/provider";
import type { ChunkStrategy } from "../db/schema";
import { fulltextSearch } from "./fulltext";
import { vectorSearch, type RetrievalResult } from "./vector";

export const RRF_K = 60;

/** Pure RRF để phép trộn có thể kiểm thử độc lập với DB/model. */
export function reciprocalRankFusion(
  rankings: RetrievalResult[][],
  topK: number,
  k = RRF_K,
): RetrievalResult[] {
  const fused = new Map<string, RetrievalResult>();

  for (const ranking of rankings) {
    ranking.forEach((result, index) => {
      const current = fused.get(result.chunkId);
      const rrfScore = (current?.rrfScore ?? 0) + 1 / (k + index + 1);
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
  return reciprocalRankFusion([vectorResults, fulltextResults], options.topK);
}
