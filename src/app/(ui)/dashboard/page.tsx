"use client";

import { useEffect, useState } from "react";
import type { EvalRun, StatsResponse } from "@/types/contract";

function O({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="rounded-[--bo-lon] bg-giay px-4 py-3.5">
      <p className="nhan-hoa">{nhan}</p>
      <p className="so-hieu mt-1.5 text-xl text-muc-in">{giaTri}</p>
    </div>
  );
}

export default function TrangDoLuong() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [evalRuns, setEvalRuns] = useState<EvalRun[]>([]);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/stats").then(readJson<StatsResponse>),
      fetch("/api/eval/runs").then(readJson<EvalRun[]>),
    ])
      .then(([nextStats, nextRuns]) => {
        if (!active) return;
        setStats(nextStats);
        setEvalRuns(nextRuns);
      })
      .catch((error: unknown) => {
        if (active) setLoi(error instanceof Error ? error.message : "Không đọc được số liệu.");
      });
    return () => {
      active = false;
    };
  }, []);

  const phanTram = (value: number) => `${Math.round(value * 100)}%`;
  const lanChayMoiNhat = evalRuns.at(-1) ?? null;

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-lg font-semibold">Đo lường</h1>
        {loi ? <p className="mt-3 text-sm text-dau-do">{loi}</p> : null}
        {!stats && !loi ? <p className="mt-3 text-sm text-nhan">Đang tải số liệu thật…</p> : null}

        {stats ? (
          <>
            <section className="mt-5">
              <h2 className="nhan-hoa">Khu A — Kho văn bản</h2>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <O nhan="Văn bản" giaTri={String(stats.tongVanBan)} />
                <O nhan="Chunk" giaTri={String(stats.tongChunk)} />
                <O nhan="Bóc tách sạch" giaTri={phanTram(stats.tyLeParseSach)} />
                <O nhan="Cơ quan" giaTri={String(stats.theoCoQuan.length)} />
              </div>
            </section>

            <section className="mt-6">
              <h2 className="nhan-hoa">Khu B — Chất lượng hệ thống</h2>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <O nhan="Độ trễ P50" giaTri={`${stats.latencyP50} ms`} />
                <O nhan="Độ trễ P95" giaTri={`${stats.latencyP95} ms`} />
                <O nhan="Có trích dẫn" giaTri={phanTram(stats.tyLeCoTrichDan)} />
                <O
                  nhan={lanChayMoiNhat ? `Recall@5 · ${lanChayMoiNhat.configName}` : "Recall@5"}
                  giaTri={lanChayMoiNhat ? phanTram(lanChayMoiNhat.recallAt5) : "Chưa chạy"}
                />
              </div>

              <h3 className="nhan-hoa mt-5">Câu hỏi có điểm truy hồi thấp nhất</h3>
              {stats.cauHoiDiemThap.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {stats.cauHoiDiemThap.map((item) => (
                    <li
                      key={`${item.at}-${item.question}`}
                      className="flex items-start gap-3 rounded-[--bo] bg-giay px-3.5 py-2.5 text-sm"
                    >
                      <span className="so-hieu shrink-0 text-nhan">
                        {item.topScore.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="leading-snug">{item.question}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-nhan">Chưa có truy vấn nào được ghi nhận.</p>
              )}
            </section>

            <section className="mt-6 pb-6">
              <h2 className="nhan-hoa">Các lần đánh giá truy hồi</h2>
              {evalRuns.length > 0 ? (
                <div className="mt-2 overflow-x-auto rounded-[--bo-lon] bg-giay">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="text-nhan">
                      <tr>
                        <th className="px-4 py-3 font-medium">Cấu hình</th>
                        <th className="px-4 py-3 font-medium">Recall@5</th>
                        <th className="px-4 py-3 font-medium">Recall@10</th>
                        <th className="px-4 py-3 font-medium">MRR</th>
                        <th className="px-4 py-3 font-medium">Số câu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evalRuns.map((run) => (
                        <tr key={run.id} className="border-t border-khay-sau">
                          <td className="px-4 py-3">{run.configName}</td>
                          <td className="so-hieu px-4 py-3">{phanTram(run.recallAt5)}</td>
                          <td className="so-hieu px-4 py-3">{phanTram(run.recallAt10)}</td>
                          <td className="so-hieu px-4 py-3">{run.mrr.toFixed(2)}</td>
                          <td className="so-hieu px-4 py-3">{run.nQuestions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-sm text-nhan">Chưa có lần chạy eval trong cơ sở dữ liệu.</p>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | { error?: string };
  if (!response.ok) {
    throw new Error("error" in (data as object) ? (data as { error?: string }).error : "Không đọc được dữ liệu.");
  }
  return data as T;
}
