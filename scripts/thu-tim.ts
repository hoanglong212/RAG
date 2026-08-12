import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

interface Options {
  question: string;
  mode: "vector" | "hybrid";
  strategy: "structural" | "fixed";
  topK: number;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const { timKiem } = await import("../src/lib/retrieval");
  const results = await timKiem(options.question, options);
  console.table(
    results.map((result, index) => ({
      rank: index + 1,
      soHieu: result.soHieu,
      breadcrumb: result.breadcrumb,
      score: result.score.toFixed(4),
      rrf: result.rrfScore?.toFixed(6) ?? "-",
      preview: result.content.replace(/\s+/g, " ").slice(0, 100),
    })),
  );
  const { sql } = await import("../src/lib/db/client");
  await sql.end({ timeout: 5 });
}

function parseOptions(args: string[]): Options {
  let question = "";
  let mode: Options["mode"] = "hybrid";
  let strategy: Options["strategy"] = "structural";
  let topK = 5;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index + 1];
    if (args[index] === "--question" && value) question = value;
    if (args[index] === "--mode" && (value === "vector" || value === "hybrid")) mode = value;
    if (args[index] === "--strategy" && (value === "structural" || value === "fixed")) {
      strategy = value;
    }
    if (args[index] === "--topK" && value) topK = Number.parseInt(value, 10);
  }
  if (question.trim() === "") throw new Error("Thiếu --question.");
  if (!Number.isInteger(topK) || topK < 1 || topK > 50) {
    throw new Error("--topK phải là số nguyên từ 1 đến 50.");
  }
  return { question, mode, strategy, topK };
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
