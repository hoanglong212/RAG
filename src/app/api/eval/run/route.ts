import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { createEmbeddingProvider } from "@/lib/embedding/provider";
import { goldSet } from "@/lib/eval/gold";
import {
  EVAL_CONFIGS,
  loadGoldChunkRows,
  resolveGoldChunks,
  runEvalConfig,
  seedGoldQuestions,
} from "@/lib/eval/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { configName?: unknown };
    const requested = typeof body.configName === "string" ? body.configName.toUpperCase() : "";
    const evalConfig = EVAL_CONFIGS.find(
      (item) => item.id === requested || item.configName.toUpperCase() === requested,
    );
    if (!evalConfig) {
      return NextResponse.json(
        { error: "configName phải là E1, E2, E3 hoặc tên cấu hình đầy đủ." },
        { status: 400 },
      );
    }

    const [chunkRows, embeddingProvider] = await Promise.all([
      loadGoldChunkRows(sql),
      createEmbeddingProvider(),
    ]);
    const resolved = resolveGoldChunks(goldSet, chunkRows);
    await seedGoldQuestions(sql, goldSet, resolved);
    const result = await runEvalConfig(
      sql,
      goldSet,
      resolved,
      evalConfig,
      embeddingProvider,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không chạy được eval." },
      { status: 500 },
    );
  }
}
