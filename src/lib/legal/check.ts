import type { Citation } from "../../types/contract";
import { NEWS_TOPICS, type LegalCheckStatus, type NewsTopic } from "../../types/news";
import { classifyNews } from "../news/classifier";
import { streamGroundedAnswer } from "../llm/provider";
import { timKiem } from "../retrieval";
import { matchViolationRules, resolveRuleEvidence, type MatchedViolationRule } from "./rules";

export interface LegalCheckResult {
  status: LegalCheckStatus;
  detectedTopics: NewsTopic[];
  supportedTopics: NewsTopic[];
  answer: string | null;
  citations: Citation[];
  topScore: number;
  matchedRules: MatchedViolationRule[];
  disclaimer: string;
}

export async function checkLegalScenario(
  scenario: string,
  requestedTopic?: NewsTopic,
): Promise<LegalCheckResult> {
  const detected = classifyNews(scenario).topics;
  const detectedTopics = requestedTopic ? [requestedTopic] : detected;
  const supportedTopics = readSupportedTopics();
  const activeTopics = detectedTopics.filter((topic) => supportedTopics.includes(topic));
  const isSupported = activeTopics.length > 0;
  const disclaimer =
    "Kết quả chỉ là đối chiếu sơ bộ từ corpus hiện có, không phải kết luận vi phạm hoặc tư vấn pháp lý.";
  if (!isSupported) {
    return {
      status: "insufficient_corpus",
      detectedTopics,
      supportedTopics,
      answer: null,
      citations: [],
      topScore: 0,
      matchedRules: [],
      disclaimer,
    };
  }

  const question = `Tình huống: ${scenario}\nHãy xác định dấu hiệu hành vi có thể liên quan, quy định tương ứng và các dữ kiện còn thiếu để có thể kết luận.`;
  // Retrieval chỉ dùng sự kiện gốc; câu hướng dẫn dài sẽ làm loãng embedding của hành vi.
  const matchedRules = matchViolationRules(scenario);
  const scopedRules = matchedRules.filter((rule) => activeTopics.includes(rule.topic));
  const retrieved = await timKiem(scenario, {
    mode: "hybrid",
    strategy: "structural",
    topK: 8,
    candidateK: 80,
    lexicalWeight: 1,
    legalTopics: activeTopics,
  });
  const ruleEvidence = scopedRules.length === 0
    ? []
    : await resolveRuleEvidence((await import("../db/client")).sql, scopedRules);
  // Rule đã được kiểm chứng theo locator thì không trộn văn bản cũ có nội dung tương tự.
  const results = ruleEvidence.length > 0 ? ruleEvidence : retrieved;
  const topScore = results[0]?.score ?? 0;
  const threshold = readThreshold();
  if (topScore < threshold) {
    return {
      status: "no_match",
      detectedTopics,
      supportedTopics,
      answer: null,
      citations: [],
      topScore,
      matchedRules: scopedRules,
      disclaimer,
    };
  }
  const citations: Citation[] = results.map((result) => ({
    chunkId: result.chunkId,
    documentId: result.documentId,
    nodeId: result.nodeId ?? "",
    soHieu: result.soHieu ?? "Không rõ số hiệu",
    breadcrumb: result.breadcrumb,
    trichDoan: result.content.slice(0, 500),
    score: result.score,
  }));
  try {
    let answer = "";
    for await (const token of streamGroundedAnswer({
      question,
      passages: results.map((result, index) => ({
        index: index + 1,
        source: `${result.soHieu ?? "Không rõ số hiệu"} > ${result.breadcrumb}`,
        content: result.content,
      })),
    })) answer += token;
    if (!answer.trim() || answer.trim() === "KHÔNG_TÌM_THẤY") {
      return { status: "evidence_only", detectedTopics, supportedTopics, answer: null, citations, topScore, matchedRules: scopedRules, disclaimer };
    }
    return { status: "matched", detectedTopics, supportedTopics, answer, citations, topScore, matchedRules: scopedRules, disclaimer };
  } catch {
    return { status: "evidence_only", detectedTopics, supportedTopics, answer: null, citations, topScore, matchedRules: scopedRules, disclaimer };
  }
}

export function readSupportedTopics(env: NodeJS.ProcessEnv = process.env): NewsTopic[] {
  const configured = env.LEGAL_CORPUS_TOPICS
    ?.split(",")
    .map((item) => item.trim())
    .filter((item): item is NewsTopic => NEWS_TOPICS.includes(item as NewsTopic));
  return configured?.length
    ? configured
    : ["an_toan_thuc_pham", "lao_dong", "giao_thong", "dat_dai_nha_o", "nguoi_tieu_dung"];
}

function readThreshold(): number {
  const value = Number(process.env.NGUONG_DIEM_TOI_THIEU ?? "0.35");
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.35;
}
