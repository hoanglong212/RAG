import { NextResponse } from "next/server";
import { z } from "zod";
import { checkLegalScenario } from "@/lib/legal/check";
import { NEWS_TOPICS } from "@/types/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema = z.object({
  scenario: z.string().trim().min(10).max(5_000),
  topic: z.enum(NEWS_TOPICS).optional(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Tình huống hoặc chủ đề không hợp lệ." }, { status: 400 });
  }
  try {
    return NextResponse.json(await checkLegalScenario(parsed.data.scenario, parsed.data.topic));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đối chiếu được tình huống." },
      { status: 500 },
    );
  }
}
