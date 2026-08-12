import { NextResponse } from "next/server";
import { z } from "zod";
import { readLlmConfig, streamResearchAnswer } from "@/lib/llm/provider";
import {
  enrichWebSources,
  hasValidResearchCitations,
  readResearchConfig,
  researchLegalWeb,
} from "@/lib/research/provider";
import { timKiem, type RetrievalResult } from "@/lib/retrieval";
import type { ChatStatus } from "@/types/contract";
import type { ResearchProgress, ResearchSource } from "@/types/research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const requestSchema = z.object({
  question: z.string().trim().min(1).max(2_000),
  strategy: z.enum(["structural", "fixed"]).default("structural"),
  mode: z.enum(["vector", "hybrid"]).default("hybrid"),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Yêu cầu nghiên cứu không hợp lệ." }, { status: 400 });
  }

  return createEventStream(async (send) => {
    const startedAt = performance.now();
    const { question, strategy, mode } = parsed.data;
    let status: ChatStatus = "ok";
    let answer = "";

    try {
      progress(send, "corpus", "Đang đối chiếu kho văn bản nội bộ");
      const localPromise = timKiem(question, { strategy, mode, topK: 8 }).catch(() => []);

      progress(send, "web", "Đang tìm nguồn pháp luật trên web");
      const researchConfig = readResearchConfig();
      const webPromise = researchLegalWeb(question, researchConfig).then((sources) =>
        enrichWebSources(sources, question, researchConfig.domains),
      );
      const [localResults, webSources] = await Promise.all([localPromise, webPromise]);

      progress(send, "cross_check", "Đang phân loại và đối chiếu nguồn");
      const localSources = toLocalSources(localResults, readThreshold());
      const sources = reindex([...localSources, ...webSources]);
      send("research_sources", { sources });

      if (sources.length === 0) {
        status = "khong_tim_thay";
        send("done", donePayload(status, startedAt, 0));
        return;
      }

      progress(send, "synthesis", "Đang tổng hợp câu trả lời có dẫn nguồn");
      for await (const token of streamResearchAnswer(
        {
          question,
          sources: sources.map((source, index) => ({
            index: index + 1,
            source: sourceLabel(source),
            sourceType:
              source.kind === "corpus"
                ? "Kho nội bộ"
                : source.kind === "official_web"
                  ? "Nguồn chính thức"
                  : "Nguồn tham khảo",
            content: source.excerpt,
          })),
        },
        readLlmConfig(),
      )) {
        answer += token;
      }

      if (answer.trim() === "KHÔNG_TÌM_THẤY") {
        status = "khong_tim_thay";
        answer = "";
      } else if (!hasValidResearchCitations(answer, sources.length)) {
        answer = `Đã tìm thấy nguồn liên quan nhưng chưa trích được điều khoản đủ cụ thể để trả lời an toàn. Hãy mở nguồn [1] để kiểm tra văn bản gốc hoặc thu hẹp câu hỏi theo Điều/Khoản cần tra.`;
      }
      if (answer) send("token", { text: answer });
      send("done", donePayload(status, startedAt, sources.length));
    } catch (error) {
      status = "loi";
      send("research_error", {
        message: error instanceof Error ? safeError(error.message) : "Không thể hoàn tất nghiên cứu.",
      });
      send("done", donePayload(status, startedAt, 0));
    }
  });
}

function toLocalSources(results: RetrievalResult[], threshold: number): ResearchSource[] {
  return results
    .filter((result) => result.score >= threshold)
    .slice(0, 4)
    .map((result) => ({
      id: `corpus:${result.chunkId}`,
      kind: "corpus",
      title: `${result.soHieu ?? "Văn bản trong kho"} — ${result.breadcrumb}`,
      excerpt: result.content.slice(0, 1_200),
      score: result.score,
      documentId: result.documentId,
      chunkId: result.chunkId,
      nodeId: result.nodeId ?? "",
      soHieu: result.soHieu ?? "Không rõ số hiệu",
      breadcrumb: result.breadcrumb,
    }));
}

function reindex(sources: ResearchSource[]): ResearchSource[] {
  return sources.map((source, index) => ({ ...source, id: `${source.kind}:${index + 1}:${source.id}` }));
}

function sourceLabel(source: ResearchSource): string {
  if (source.kind === "corpus") return source.title;
  return `${source.domain ?? "Nguồn web"} — ${source.title} — ${source.url ?? ""}`;
}

function readThreshold(): number {
  const value = Number(process.env.NGUONG_DIEM_TOI_THIEU ?? "0.35");
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.35;
}

function progress(
  send: (event: string, data: unknown) => void,
  stage: ResearchProgress["stage"],
  label: string,
) {
  send("research_progress", { stage, label } satisfies ResearchProgress);
}

function donePayload(status: ChatStatus, startedAt: number, sourceCount: number) {
  return {
    status,
    sourceCount,
    latencyMs: Math.round(performance.now() - startedAt),
    researchMode: true,
  };
}

function safeError(message: string): string {
  if (/GROQ_API_KEY/i.test(message)) return "Chưa cấu hình Groq cho chế độ Nghiên cứu sâu.";
  if (/HTTP 429/.test(message)) return "Groq đang giới hạn lượt nghiên cứu. Hãy thử lại sau ít phút.";
  if (/timeout|abort/i.test(message)) return "Nghiên cứu vượt quá thời gian chờ. Hãy thu hẹp câu hỏi.";
  return "Không thể hoàn tất nghiên cứu sâu ở thời điểm này.";
}

function createEventStream(run: (send: (event: string, data: unknown) => void) => Promise<void>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        await run(send);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "content-type": "text/event-stream; charset=utf-8",
    },
  });
}
