import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/client";
import type { CompareChange } from "@/types/platform";

export const runtime = "nodejs";

const schema = z.object({ left: z.string().uuid(), right: z.string().uuid() }).refine((value) => value.left !== value.right);

export async function GET(request: Request) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Hãy chọn hai văn bản khác nhau." }, { status: 400 });
  const [docs, leftNodes, rightNodes] = await Promise.all([
    sql`SELECT id, so_hieu, trich_yeu FROM documents WHERE id IN (${parsed.data.left}, ${parsed.data.right})`,
    readNodes(parsed.data.left), readNodes(parsed.data.right),
  ]);
  if (docs.length !== 2) return NextResponse.json({ error: "Không tìm thấy đủ hai văn bản." }, { status: 404 });
  const leftMap = new Map(leftNodes.map((node) => [node.key, node]));
  const rightMap = new Map(rightNodes.map((node) => [node.key, node]));
  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])];
  const changes: CompareChange[] = [];
  for (const key of keys) {
    const left = leftMap.get(key);
    const right = rightMap.get(key);
    if (!left) changes.push({ key, kind: "added", breadcrumb: right?.breadcrumb ?? key, left: null, right: right?.content ?? null });
    else if (!right) changes.push({ key, kind: "removed", breadcrumb: left.breadcrumb, left: left.content, right: null });
    else if (normalize(left.content) !== normalize(right.content)) {
      changes.push({ key, kind: "changed", breadcrumb: right.breadcrumb, left: left.content, right: right.content });
    }
  }
  return NextResponse.json({
    left: docs.find((doc) => String(doc.id) === parsed.data.left),
    right: docs.find((doc) => String(doc.id) === parsed.data.right),
    summary: {
      added: changes.filter((item) => item.kind === "added").length,
      removed: changes.filter((item) => item.kind === "removed").length,
      changed: changes.filter((item) => item.kind === "changed").length,
    },
    changes: changes.slice(0, 200),
  });
}

async function readNodes(documentId: string) {
  const rows = await sql`
    SELECT node_type, so_thu_tu, breadcrumb, tieu_de, noi_dung
    FROM doc_nodes WHERE document_id = ${documentId} ORDER BY order_index`;
  return rows.map((row) => ({
    key: `${row.node_type}:${String(row.breadcrumb).split(">").slice(1).map((part) => part.trim()).join(">") || row.so_thu_tu || ""}`,
    breadcrumb: String(row.breadcrumb),
    content: [row.tieu_de, row.noi_dung].filter(Boolean).join("\n"),
  }));
}

function normalize(value: string): string { return value.normalize("NFKC").replace(/\s+/g, " ").trim(); }
