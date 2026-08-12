import type postgres from "postgres";
import type { EvalRun } from "../../types/contract";
import type { ChunkStrategy } from "../db/schema";
import type { EmbeddingProvider } from "../embedding/provider";
import { timKiem, type RetrievalResult } from "../retrieval";

export type GoldQuestionGroup = "direct" | "paraphrase" | "identifier";

export interface GoldQuestion {
  id: string;
  group: GoldQuestionGroup;
  question: string;
  source: {
    soHieu: string;
    dieu: number;
    khoan?: number;
    diem?: string;
  };
  answerText: string;
}

export interface GoldSet {
  schemaVersion: number;
  description: string;
  questions: GoldQuestion[];
}

export interface EvalConfig {
  id: "E1" | "E2" | "E3";
  configName: string;
  mode: "vector" | "hybrid";
  strategy: ChunkStrategy;
  notes: string;
}

export const EVAL_CONFIGS: readonly EvalConfig[] = [
  {
    id: "E1",
    configName: "E1-fixed-vector-BKAI",
    mode: "vector",
    strategy: "fixed",
    notes: "Đường cơ sở: fixed 512 token, chỉ tìm kiếm vector.",
  },
  {
    id: "E2",
    configName: "E2-structural-vector-BKAI",
    mode: "vector",
    strategy: "structural",
    notes: "Chỉ đổi chunking sang cấu trúc Điều/Khoản; giữ nguyên embedder và vector search.",
  },
  {
    id: "E3",
    configName: "E3-structural-hybrid-BKAI",
    mode: "hybrid",
    strategy: "structural",
    notes: "Giữ structural chunking, thêm full-text và weighted RRF k=60; số hiệu pháp lý nhận trọng số lexical cao hơn.",
  },
] as const;

export interface GoldChunkRow {
  id: string;
  strategy: ChunkStrategy;
  so_hieu: string | null;
  dieu_so: number | null;
  khoan_so: number | null;
  diem: string | null;
  noi_dung: string;
}

export type ResolvedGold = Record<ChunkStrategy, Map<string, string[]>>;

export interface EvalMetrics {
  recallAt5: number;
  recallAt10: number;
  mrr: number;
  nQuestions: number;
}

export interface EvalRunResult extends EvalRun {
  configId: EvalConfig["id"];
  strategy: ChunkStrategy;
  mode: EvalConfig["mode"];
  byGroup: Record<GoldQuestionGroup, EvalMetrics>;
  durationMs: number;
}

type SearchFn = (
  question: string,
  options: { mode: EvalConfig["mode"]; strategy: ChunkStrategy; topK: number },
  provider: EmbeddingProvider,
) => Promise<RetrievalResult[]>;

export function parseGoldSet(value: unknown): GoldSet {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.questions)) {
    throw new Error("data/eval/cau-hoi.json không đúng schemaVersion 1.");
  }
  const questions = value.questions.map(parseQuestion);
  const expected: Record<GoldQuestionGroup, number> = {
    direct: 15,
    paraphrase: 15,
    identifier: 10,
  };
  if (questions.length !== 40) {
    throw new Error(`Bộ câu hỏi vàng phải có đúng 40 câu; hiện có ${questions.length}.`);
  }
  const ids = new Set<string>();
  const prompts = new Set<string>();
  const counts: Record<GoldQuestionGroup, number> = { direct: 0, paraphrase: 0, identifier: 0 };
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error(`Trùng id câu hỏi vàng: ${question.id}.`);
    const normalizedPrompt = normalizeText(question.question);
    if (prompts.has(normalizedPrompt)) throw new Error(`Trùng nội dung câu hỏi: ${question.id}.`);
    ids.add(question.id);
    prompts.add(normalizedPrompt);
    counts[question.group] += 1;
    if (question.group === "identifier" && !normalizedPrompt.includes(normalizeText(question.source.soHieu))) {
      throw new Error(`${question.id} thuộc nhóm identifier nhưng không nhắc số hiệu ${question.source.soHieu}.`);
    }
  }
  for (const group of Object.keys(expected) as GoldQuestionGroup[]) {
    if (counts[group] !== expected[group]) {
      throw new Error(`Nhóm ${group} phải có ${expected[group]} câu; hiện có ${counts[group]}.`);
    }
  }
  return {
    schemaVersion: 1,
    description: typeof value.description === "string" ? value.description : "",
    questions,
  };
}

export function resolveGoldChunks(goldSet: GoldSet, rows: GoldChunkRow[]): ResolvedGold {
  const resolved: ResolvedGold = {
    fixed: new Map<string, string[]>(),
    structural: new Map<string, string[]>(),
  };
  for (const strategy of ["fixed", "structural"] as const) {
    for (const question of goldSet.questions) {
      const answer = normalizeText(question.answerText);
      const matches = rows.filter((row) => {
        if (row.strategy !== strategy || row.so_hieu !== question.source.soHieu) return false;
        if (!normalizeText(row.noi_dung).includes(answer)) return false;
        if (strategy === "fixed") return true;
        return (
          row.dieu_so === question.source.dieu &&
          (question.source.khoan === undefined || row.khoan_so === question.source.khoan) &&
          (question.source.diem === undefined || row.diem === question.source.diem)
        );
      });
      if (matches.length === 0) {
        const locator = `${question.source.soHieu} Điều ${question.source.dieu}` +
          (question.source.khoan === undefined ? "" : ` Khoản ${question.source.khoan}`) +
          (question.source.diem === undefined ? "" : ` Điểm ${question.source.diem}`);
        throw new Error(`${question.id} không ánh xạ được sang chunk ${strategy} tại ${locator}.`);
      }
      resolved[strategy].set(question.id, matches.map((row) => row.id));
    }
  }
  return resolved;
}

export function calculateMetrics(
  rankings: Array<{ question: GoldQuestion; chunkIds: string[] }>,
  relevant: Map<string, string[]>,
): EvalMetrics {
  if (rankings.length === 0) return { recallAt5: 0, recallAt10: 0, mrr: 0, nQuestions: 0 };
  let hitsAt5 = 0;
  let hitsAt10 = 0;
  let reciprocalRank = 0;
  for (const ranking of rankings) {
    const expected = new Set(relevant.get(ranking.question.id) ?? []);
    const firstHit = ranking.chunkIds.findIndex((id) => expected.has(id));
    if (firstHit >= 0 && firstHit < 5) hitsAt5 += 1;
    if (firstHit >= 0 && firstHit < 10) hitsAt10 += 1;
    if (firstHit >= 0) reciprocalRank += 1 / (firstHit + 1);
  }
  return {
    recallAt5: hitsAt5 / rankings.length,
    recallAt10: hitsAt10 / rankings.length,
    mrr: reciprocalRank / rankings.length,
    nQuestions: rankings.length,
  };
}

export async function loadGoldChunkRows(sql: postgres.Sql): Promise<GoldChunkRow[]> {
  return sql<GoldChunkRow[]>`
    SELECT c.id, c.strategy, d.so_hieu, c.dieu_so, c.khoan_so, c.diem, c.noi_dung
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    WHERE c.strategy IN ('fixed', 'structural')
  `;
}

export async function seedGoldQuestions(
  sql: postgres.Sql,
  goldSet: GoldSet,
  resolved: ResolvedGold,
): Promise<void> {
  await sql.begin(async (transaction) => {
    await transaction`DELETE FROM cau_hoi_eval`;
    for (const question of goldSet.questions) {
      const ids = [
        ...(resolved.fixed.get(question.id) ?? []),
        ...(resolved.structural.get(question.id) ?? []),
      ];
      const note = JSON.stringify({
        goldId: question.id,
        group: question.group,
        source: question.source,
        answerText: question.answerText,
      });
      await transaction`
        INSERT INTO cau_hoi_eval (cau_hoi, chunk_dung_ids, ghi_chu)
        VALUES (${question.question}, ${ids}::uuid[], ${note})
      `;
    }
  });
}

export async function runEvalConfig(
  sql: postgres.Sql,
  goldSet: GoldSet,
  resolved: ResolvedGold,
  config: EvalConfig,
  embeddingProvider: EmbeddingProvider,
  onProgress?: (completed: number, total: number, question: GoldQuestion) => void,
  search: SearchFn = timKiem,
): Promise<EvalRunResult> {
  const startedAt = Date.now();
  const rankings: Array<{ question: GoldQuestion; chunkIds: string[] }> = [];
  for (let index = 0; index < goldSet.questions.length; index += 1) {
    const question = goldSet.questions[index];
    const results = await search(
      question.question,
      { mode: config.mode, strategy: config.strategy, topK: 10 },
      embeddingProvider,
    );
    rankings.push({ question, chunkIds: results.map((result) => result.chunkId) });
    onProgress?.(index + 1, goldSet.questions.length, question);
  }

  const relevant = resolved[config.strategy];
  const metrics = calculateMetrics(rankings, relevant);
  const byGroup = Object.fromEntries(
    (["direct", "paraphrase", "identifier"] as const).map((group) => [
      group,
      calculateMetrics(rankings.filter((ranking) => ranking.question.group === group), relevant),
    ]),
  ) as Record<GoldQuestionGroup, EvalMetrics>;
  const durationMs = Date.now() - startedAt;
  const storedConfig = {
    configId: config.id,
    mode: config.mode,
    strategy: config.strategy,
    topK: 10,
    notes: config.notes,
    durationMs,
    byGroup,
  };
  const rows = await sql<
    Array<{
      id: string;
      ten_lan_chay: string;
      recall_at_5: number;
      recall_at_10: number;
      mrr: number;
      so_cau_hoi: number;
      created_at: Date;
    }>
  >`
    INSERT INTO lan_chay_eval (
      ten_lan_chay, cau_hinh, recall_at_5, recall_at_10,
      embedder_name, strategy, mrr, so_cau_hoi
    ) VALUES (
      ${config.configName}, ${JSON.stringify(storedConfig)}::jsonb, ${metrics.recallAt5}, ${metrics.recallAt10},
      ${embeddingProvider.name}, ${config.strategy}, ${metrics.mrr}, ${metrics.nQuestions}
    )
    RETURNING id, ten_lan_chay, recall_at_5, recall_at_10, mrr, so_cau_hoi, created_at
  `;
  const row = rows[0];
  if (!row) throw new Error(`Không ghi được kết quả ${config.id} vào lan_chay_eval.`);
  return {
    id: row.id,
    configId: config.id,
    configName: row.ten_lan_chay,
    recallAt5: Number(row.recall_at_5),
    recallAt10: Number(row.recall_at_10),
    mrr: Number(row.mrr),
    nQuestions: Number(row.so_cau_hoi),
    notes: config.notes,
    runAt: new Date(row.created_at).toISOString(),
    strategy: config.strategy,
    mode: config.mode,
    byGroup,
    durationMs,
  };
}

export function toEvalRun(row: Record<string, unknown>): EvalRun {
  const config = isRecord(row.cau_hinh) ? row.cau_hinh : {};
  return {
    id: String(row.id),
    configName: String(row.ten_lan_chay),
    recallAt5: Number(row.recall_at_5 ?? 0),
    recallAt10: Number(row.recall_at_10 ?? 0),
    mrr: Number(row.mrr ?? 0),
    nQuestions: Number(row.so_cau_hoi ?? 0),
    notes: typeof config.notes === "string" ? config.notes : null,
    runAt: new Date(String(row.created_at)).toISOString(),
  };
}

export function normalizeText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("vi").replace(/\s+/g, " ").trim();
}

function parseQuestion(value: unknown, index: number): GoldQuestion {
  if (!isRecord(value) || !isRecord(value.source)) {
    throw new Error(`Câu hỏi vàng thứ ${index + 1} không hợp lệ.`);
  }
  const group = value.group;
  if (group !== "direct" && group !== "paraphrase" && group !== "identifier") {
    throw new Error(`Câu hỏi vàng thứ ${index + 1} có group không hợp lệ.`);
  }
  const requiredStrings = [value.id, value.question, value.source.soHieu, value.answerText];
  if (requiredStrings.some((entry) => typeof entry !== "string" || entry.trim() === "")) {
    throw new Error(`Câu hỏi vàng thứ ${index + 1} thiếu trường chuỗi bắt buộc.`);
  }
  if (!Number.isInteger(value.source.dieu) || Number(value.source.dieu) < 1) {
    throw new Error(`Câu hỏi ${value.id} có số Điều không hợp lệ.`);
  }
  if (value.source.khoan !== undefined && !Number.isInteger(value.source.khoan)) {
    throw new Error(`Câu hỏi ${value.id} có số Khoản không hợp lệ.`);
  }
  return {
    id: String(value.id),
    group,
    question: String(value.question),
    source: {
      soHieu: String(value.source.soHieu),
      dieu: Number(value.source.dieu),
      ...(value.source.khoan === undefined ? {} : { khoan: Number(value.source.khoan) }),
      ...(typeof value.source.diem === "string" ? { diem: value.source.diem } : {}),
    },
    answerText: String(value.answerText),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
