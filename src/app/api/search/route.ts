import { NextResponse } from "next/server";
import { z } from "zod";
import { timKiem } from "@/lib/retrieval";
import type { Citation } from "@/types/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  question: z.string().trim().min(1).max(2_000),
  strategy: z.enum(["structural", "fixed"]).default("structural"),
  mode: z.enum(["vector", "hybrid", "hybrid_rerank"]).default("hybrid"),
  topK: z.number().int().min(1).max(50).default(5),
});

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yêu cầu tìm kiếm không hợp lệ." }, { status: 400 });
  }
  if (parsed.data.mode === "hybrid_rerank") {
    return NextResponse.json(
      { error: "Mode hybrid_rerank là thí nghiệm E4 tùy chọn và chưa được bật." },
      { status: 501 },
    );
  }

  try {
    const results = await timKiem(parsed.data.question, parsed.data);
    const citations: Citation[] = results.map((result) => ({
      chunkId: result.chunkId,
      documentId: result.documentId,
      nodeId: result.nodeId ?? "",
      soHieu: result.soHieu ?? "Không rõ số hiệu",
      breadcrumb: result.breadcrumb,
      trichDoan: result.content.slice(0, 500),
      score: result.score,
    }));
    return NextResponse.json({ citations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể tìm kiếm." },
      { status: 500 },
    );
  }
}
