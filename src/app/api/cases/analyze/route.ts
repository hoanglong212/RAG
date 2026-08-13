import { NextResponse } from "next/server";
import { z } from "zod";
import { checkLegalScenario } from "@/lib/legal/check";
import { buildMissingFacts, buildNextSteps } from "@/lib/legal/case-guidance";
import { NEWS_TOPICS } from "@/types/news";
import type { CaseAnalysis } from "@/types/platform";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  scenario: z.string().trim().min(10).max(5_000),
  topic: z.enum(NEWS_TOPICS).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Tình huống không hợp lệ." }, { status: 400 });
  try {
    const result = await checkLegalScenario(parsed.data.scenario, parsed.data.topic);
    const analysis: CaseAnalysis = {
      status: result.status,
      answer: result.answer,
      phanTich: result.phanTich,
      citations: result.citations,
      topScore: result.topScore,
      detectedTopics: result.detectedTopics,
      missingFacts: buildMissingFacts(parsed.data.scenario, result.detectedTopics),
      nextSteps: buildNextSteps(result.citations.length > 0),
      disclaimer: result.disclaimer,
    };
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không phân tích được hồ sơ." }, { status: 500 });
  }
}
