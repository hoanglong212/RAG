import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/client";
import { parsePenaltyRange } from "@/lib/legal/penalty";
import { matchViolationRules, resolveRuleEvidence } from "@/lib/legal/rules";
import type { Citation } from "@/types/contract";
import type { PenaltyResult } from "@/types/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ scenario: z.string().trim().min(10).max(5_000) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Tình huống không hợp lệ." }, { status: 400 });
  const rules = matchViolationRules(parsed.data.scenario);
  const evidence = await resolveRuleEvidence(sql, rules);
  const results: PenaltyResult[] = rules.map((rule) => {
    const match = evidence.find((item) => item.soHieu === rule.source.soHieu && item.breadcrumb.includes(`Điều ${rule.source.dieu}`));
    const range = match ? parsePenaltyRange(match.content) : null;
    const citation: Citation | null = match ? {
      chunkId: match.chunkId, documentId: match.documentId, nodeId: match.nodeId ?? "",
      soHieu: match.soHieu ?? rule.source.soHieu, breadcrumb: match.breadcrumb,
      trichDoan: match.content.slice(0, 500), score: match.score,
    } : null;
    return {
      ruleId: rule.id, label: rule.label, topic: rule.topic, source: rule.source,
      amountFrom: range?.from ?? null, amountTo: range?.to ?? null, evidence: citation,
    };
  });
  return NextResponse.json({ results, disclaimer: "Khoảng tiền được trích trực tiếp từ căn cứ hiện có; mức áp dụng thực tế phụ thuộc đầy đủ tình tiết và thẩm quyền xử lý." });
}
