import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { truy_van } from "@/lib/db/schema";
import { readLlmConfig, streamGroundedAnswer } from "@/lib/llm/provider";
import { timKiem, type RetrievalResult } from "@/lib/retrieval";
import type { ChatStatus, Citation } from "@/types/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  question: z.string().trim().min(1).max(2_000),
  strategy: z.enum(["structural", "fixed"]).default("structural"),
  mode: z.enum(["vector", "hybrid", "hybrid_rerank"]).default("hybrid"),
});

export async function POST(request: Request) {
  const startedAt = performance.now();
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Yêu cầu chat không hợp lệ." }, { status: 400 });
  }
  const mode = parsed.data.mode;
  if (mode === "hybrid_rerank") {
    return NextResponse.json(
      { error: "Mode hybrid_rerank là thí nghiệm E4 tùy chọn và chưa được bật." },
      { status: 501 },
    );
  }

  try {
    const results = await timKiem(parsed.data.question, { ...parsed.data, mode, topK: 8 });
    const threshold = readThreshold();
    const topScore = results[0]?.score ?? 0;
    const citations = toCitations(results);
    if (topScore < threshold) {
      return createEventStream(async (send) => {
        send("citations", { citations: [] });
        const latencyMs = Math.round(performance.now() - startedAt);
        send("done", donePayload("khong_tim_thay", topScore, threshold, latencyMs));
        await logQuery(parsed.data.question, null, [], topScore, false, latencyMs, mode);
      });
    }

    const llmConfig = readLlmConfig();
    return createEventStream(async (send) => {
      send("citations", { citations });
      let answer = "";
      let status: ChatStatus = "ok";
      try {
        for await (const token of streamGroundedAnswer(
          {
            question: parsed.data.question,
            passages: results.map((result, index) => ({
              index: index + 1,
              source: `${result.soHieu ?? "Không rõ số hiệu"} > ${result.breadcrumb}`,
              content: result.content,
            })),
          },
          llmConfig,
        )) {
          answer += token;
          send("token", { text: token });
        }
        if (answer.trim() === "KHÔNG_TÌM_THẤY") {
          status = "khong_tim_thay";
          answer = "";
        }
      } catch (error) {
        console.error(
          "Grounded answer generation failed:",
          error instanceof Error ? error.message : "Unknown LLM provider error",
        );
        status = "loi";
        answer = "";
      }
      const latencyMs = Math.round(performance.now() - startedAt);
      send("done", donePayload(status, topScore, threshold, latencyMs));
      await logQuery(
        parsed.data.question,
        answer || null,
        status === "ok" ? results.map((result) => result.chunkId) : [],
        topScore,
        status === "ok" && /\[\d+\]/.test(answer),
        latencyMs,
        mode,
      );
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể xử lý câu hỏi." },
      { status: 500 },
    );
  }
}

function toCitations(results: RetrievalResult[]): Citation[] {
  return results.map((result) => ({
    chunkId: result.chunkId,
    documentId: result.documentId,
    nodeId: result.nodeId ?? "",
    soHieu: result.soHieu ?? "Không rõ số hiệu",
    breadcrumb: result.breadcrumb,
    trichDoan: result.content.slice(0, 500),
    score: result.score,
  }));
}

function readThreshold(): number {
  const value = Number(process.env.NGUONG_DIEM_TOI_THIEU ?? "0.35");
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.35;
}

function donePayload(status: ChatStatus, topScore: number, nguong: number, latencyMs: number) {
  return { status, topScore, nguong, latencyMs };
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

async function logQuery(
  question: string,
  answer: string | null,
  chunkIds: string[],
  topScore: number,
  hasCitation: boolean,
  latencyMs: number,
  mode: "vector" | "hybrid",
) {
  await db.insert(truy_van).values({
    cau_hoi: question,
    cau_tra_loi: answer,
    chunk_ids: chunkIds,
    diem_cao_nhat: topScore,
    co_trich_dan: hasCitation,
    latency_ms: latencyMs,
    che_do_tim: mode,
  });
}
