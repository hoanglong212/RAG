/** Chạy ma trận E1–E3 trên bộ 40 câu hỏi vàng và lưu kết quả vào Postgres. */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main(): Promise<void> {
  const selected = readSelectedConfig(process.argv.slice(2));
  const validateOnly = process.argv.includes("--validate-only");
  const replaceExisting = process.argv.includes("--replace");
  const [
    { sql },
    { createEmbeddingProvider },
    { goldSet },
    { EVAL_CONFIGS, loadGoldChunkRows, resolveGoldChunks, runEvalConfig, seedGoldQuestions },
  ] = await Promise.all([
    import("../src/lib/db/client"),
    import("../src/lib/embedding/provider"),
    import("../src/lib/eval/gold"),
    import("../src/lib/eval/runner"),
  ]);

  try {
    const chunkRows = await loadGoldChunkRows(sql);
    const resolved = resolveGoldChunks(goldSet, chunkRows);
    await seedGoldQuestions(sql, goldSet, resolved);
    console.log(
      `✓ 40 câu hợp lệ; ánh xạ đủ fixed + structural; đã đồng bộ bảng cau_hoi_eval.`,
    );
    if (validateOnly) return;

    const configs = selected === "all"
      ? [...EVAL_CONFIGS]
      : EVAL_CONFIGS.filter((item) => item.id === selected);
    if (replaceExisting) {
      for (const evalConfig of configs) {
        await sql`DELETE FROM lan_chay_eval WHERE ten_lan_chay = ${evalConfig.configName}`;
      }
      console.log(`✓ Đã thay thế các lần chạy cũ của ${configs.map((item) => item.id).join(", ")}.`);
    }
    const embeddingProvider = await createEmbeddingProvider();
    const results = [];
    for (const evalConfig of configs) {
      console.log(`\n${evalConfig.id}: ${evalConfig.configName}`);
      const result = await runEvalConfig(
        sql,
        goldSet,
        resolved,
        evalConfig,
        embeddingProvider,
        (completed, total, question) => {
          process.stdout.write(`\r  ${completed}/${total} · ${question.id}`.padEnd(24));
          if (completed === total) process.stdout.write("\n");
        },
      );
      results.push(result);
    }

    console.log("\nKẾT QUẢ");
    console.table(
      results.map((result) => ({
        config: result.configId,
        strategy: result.strategy,
        mode: result.mode,
        "Recall@5": formatMetric(result.recallAt5),
        "Recall@10": formatMetric(result.recallAt10),
        MRR: formatMetric(result.mrr),
        direct: formatMetric(result.byGroup.direct.recallAt5),
        paraphrase: formatMetric(result.byGroup.paraphrase.recallAt5),
        identifier: formatMetric(result.byGroup.identifier.recallAt5),
        duration: `${(result.durationMs / 1000).toFixed(1)}s`,
      })),
    );
  } finally {
    await sql.end();
  }
}

function readSelectedConfig(args: string[]): "all" | "E1" | "E2" | "E3" {
  const raw = args.find((arg) => arg.startsWith("--config="))?.split("=", 2)[1] ?? "all";
  const normalized = raw.toUpperCase();
  if (normalized === "ALL" || normalized === "E1" || normalized === "E2" || normalized === "E3") {
    return normalized === "ALL" ? "all" : normalized;
  }
  throw new Error(`--config phải là all, E1, E2 hoặc E3; nhận được "${raw}".`);
}

function formatMetric(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
