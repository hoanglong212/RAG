import type postgres from "postgres";
import type { EmbeddingProvider } from "../embedding/provider";
import type { ChunkStrategy } from "../db/schema";
import { extractLegalIdentifier, extractLegalLocator } from "./fulltext";
import { fulltextSearch } from "./fulltext";
import { rerankForLegalIntent } from "./query-understanding";
import { vectorSearch, type RetrievalResult } from "./vector";

export const RRF_K = 60;
export const MIN_HYBRID_CANDIDATES = 40;

export function lexicalWeightForQuestion(question: string): number {
  if (extractLegalIdentifier(question) === null) return 0.05;
  // Số hiệu + Điều/Khoản/Điểm là locator chính xác, đáng tin ngang với vector.
  const locator = extractLegalLocator(question);
  return locator.dieu !== null || locator.khoan !== null || locator.diem !== null ? 1 : 0.2;
}

export function resolveHybridCandidateK(topK: number, candidateK?: number): number {
  return Math.max(topK, candidateK ?? MIN_HYBRID_CANDIDATES);
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
  options: {
    topK: number;
    strategy: ChunkStrategy;
    candidateK?: number;
    lexicalWeight?: number;
    legalTopics?: string[];
  },
  dependencies: { sql: postgres.Sql; embeddingProvider: EmbeddingProvider },
): Promise<RetrievalResult[]> {
  const candidateK = resolveHybridCandidateK(options.topK, options.candidateK);
  const [vectorResults, fulltextResults] = await Promise.all([
    vectorSearch(
      question,
      { topK: candidateK, strategy: options.strategy, legalTopics: options.legalTopics },
      dependencies,
    ),
    fulltextSearch(
      question,
      { topK: candidateK, strategy: options.strategy, legalTopics: options.legalTopics },
      dependencies.sql,
    ),
  ]);
  // Vector là trục ổn định; full-text là tín hiệu bổ sung có trọng số theo loại câu hỏi.
  const fused = reciprocalRankFusion(
    [vectorResults, fulltextResults],
    candidateK,
    RRF_K,
    [1, options.lexicalWeight ?? lexicalWeightForQuestion(question)],
  );
  return rerankForLegalIntent(question, fused).slice(0, options.topK);
}
