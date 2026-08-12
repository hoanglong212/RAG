"use client";

/**
 * Đo lường — hai khu tách bạch.
 *
 * Khu A nói về BỘ TÀI LIỆU: có gì trong kho.
 * Khu B nói về HỆ THỐNG: nó trả lời tốt tới đâu, và sai ở đâu.
 *
 * Khu B mới là khu đáng nói lúc bảo vệ, nên nó không bị nhét xuống cuối như
 * một phụ lục — danh sách câu hỏi điểm thấp chính là bản đồ lỗ hổng của kho
 * dữ liệu, và bảng eval là bằng chứng định lượng của cả dự án.
 *
 * Ba chỉ số eval được vẽ thành BA biểu đồ nhỏ cùng dạng thay vì ba màu chồng
 * trong một khung — xem chú thích ở components/kit/bieu-do.tsx.
 */

import { useCallback, useEffect, useState } from "react";
import type { EvalRun, StatsResponse } from "@/types/contract";
import { KhungTrang, OSoLieu, The, TieuDeMuc } from "@/components/kit/co-ban";
import { BieuDoNho, CotDoc, CotDocLon, CotNgang } from "@/components/kit/bieu-do";
import { BaoLoi, TrongRong, XuongSoLieu } from "@/components/kit/trang-thai-kit";
import { NHAN_LOAI, chuanHoaTenCoQuan } from "@/types/nhan";

const phanTram = (v: number) => `${Math.round(v * 100)}%`;
const soVN = (v: number) => v.toFixed(2).replace(".", ",");

export default function TrangDoLuong() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [lanChay, setLanChay] = useState<EvalRun[]>([]);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(true);

  const doc = useCallback(async () => {
    setDangTai(true);
    setLoi(null);
    try {
      const [s, e] = await Promise.all([
        fetch("/api/stats").then(docJson<StatsResponse>),
        fetch("/api/eval/runs").then(docJson<EvalRun[]>),
      ]);
      setStats(s);
      setLanChay(e);
    } catch (err) {
      setLoi(err instanceof Error ? err.message : "Không đọc được số liệu.");
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => void doc(), [doc]);

  const moiNhat = lanChay.at(-1) ?? null;
  const tenNganGon = (ten: string) => ten.split("-")[0] || ten;
  /** Bao nhiêu điểm Recall@5 kiếm được kể từ đường cơ sở. */
  const chenhLech = moiNhat && lanChay.length > 1 ? moiNhat.recallAt5 - lanChay[0].recallAt5 : 0;

  return (
    <KhungTrang
      tieuDe="Đo lường"
      moTa="Bên trái là bộ tài liệu đang có. Bên dưới là chất lượng trả lời của hệ thống, đo bằng bộ câu hỏi vàng."
      rong="rong"
    >
      {dangTai ? (
        <div className="flex flex-col gap-4">
          <XuongSoLieu />
          <XuongSoLieu />
        </div>
      ) : null}

      {loi ? <BaoLoi moTa={loi} onThuLai={() => void doc()} /> : null}

      {stats ? (
        <div className="flex flex-col gap-8">
          {/* ============ KHU A ============ */}
          <section className="flex flex-col gap-3">
            <TieuDeMuc phu="Đọc từ bảng documents và chunks">Khu A — Kho văn bản</TieuDeMuc>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <OSoLieu nhan="Văn bản" giaTri={String(stats.tongVanBan)} />
              <OSoLieu
                nhan="Chunk"
                giaTri={String(stats.tongChunk)}
                phu={
                  stats.tongVanBan > 0
                    ? `Trung bình ${Math.round(stats.tongChunk / stats.tongVanBan)} chunk mỗi văn bản`
                    : undefined
                }
              />
              <OSoLieu
                nhan="Bóc tách sạch"
                giaTri={phanTram(stats.tyLeParseSach)}
                phu="Văn bản không có cảnh báo nào"
              />
              <OSoLieu nhan="Cơ quan ban hành" giaTri={String(stats.theoCoQuan.length)} />
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <The>
                <TieuDeMuc>Theo loại văn bản</TieuDeMuc>
                <div className="mt-4">
                  <CotNgang
                    cacMuc={stats.theoLoai.map((m) => ({
                      nhan: NHAN_LOAI[m.loai],
                      giaTri: m.soLuong,
                    }))}
                  />
                </div>
              </The>

              <The>
                <TieuDeMuc phu="Sáu cơ quan có nhiều văn bản nhất">Theo cơ quan</TieuDeMuc>
                <div className="mt-4">
                  <CotNgang
                    toiDaHien={6}
                    cacMuc={stats.theoCoQuan.map((m) => ({
                      nhan: chuanHoaTenCoQuan(m.coQuan),
                      giaTri: m.soLuong,
                    }))}
                  />
                </div>
              </The>

              <The>
                <TieuDeMuc>Theo năm ban hành</TieuDeMuc>
                <div className="mt-4">
                  <CotDoc
                    cacMuc={stats.theoNam.map((m) => ({
                      nhan: String(m.nam),
                      giaTri: m.soLuong,
                    }))}
                  />
                </div>
              </The>
            </div>
          </section>

          {/* ============ KHU B ============ */}
          <section className="flex flex-col gap-3">
            <TieuDeMuc phu="Đọc từ nhật ký truy vấn và các lần chạy eval">
              Khu B — Chất lượng hệ thống
            </TieuDeMuc>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <OSoLieu nhan="Độ trễ trung vị" giaTri={`${stats.latencyP50} ms`} />
              <OSoLieu nhan="Độ trễ P95" giaTri={`${stats.latencyP95} ms`} phu="5% câu chậm nhất" />
              <OSoLieu
                nhan="Trả lời có trích dẫn"
                giaTri={phanTram(stats.tyLeCoTrichDan)}
                phu="Phần còn lại là câu hệ thống từ chối trả lời"
              />
              <OSoLieu
                nhan={moiNhat ? `Recall@5 · ${tenNganGon(moiNhat.configName)}` : "Recall@5"}
                giaTri={moiNhat ? phanTram(moiNhat.recallAt5) : "Chưa chạy"}
                phu={moiNhat ? `Trên ${moiNhat.nQuestions} câu hỏi vàng` : undefined}
              />
            </div>

            {/* ---- Biểu đồ chính: luận điểm định lượng của cả dự án ---- */}
            {lanChay.length > 0 ? (
              <The className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                <div className="flex shrink-0 flex-col justify-between gap-4 lg:w-64">
                  <TieuDeMuc phu="Tỉ lệ câu hỏi vàng có đáp án đúng nằm trong 5 kết quả đầu">
                    Recall@5 qua các lần chạy
                  </TieuDeMuc>
                  <div>
                    <p className="chu-trung-bay font-ma text-[3.25rem] tabular-nums text-muc-in">
                      {moiNhat ? phanTram(moiNhat.recallAt5) : "—"}
                    </p>
                    {moiNhat && lanChay.length > 1 ? (
                      <p className="mt-2.5 text-sm leading-relaxed text-nhan">
                        <span className="so-hieu font-medium text-muc-in">
                          {chenhLech > 0 ? "+" : ""}
                          {Math.round(chenhLech * 100)} điểm
                        </span>{" "}
                        so với đường cơ sở{" "}
                        <span className="so-hieu">{tenNganGon(lanChay[0].configName)}</span>{" "}
                        ({phanTram(lanChay[0].recallAt5)}) — kẻ đứt trên biểu đồ. Đo trên{" "}
                        {moiNhat.nQuestions} câu hỏi vàng.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <CotDocLon
                    cacMuc={lanChay.map((r) => ({
                      nhan: tenNganGon(r.configName),
                      giaTri: r.recallAt5,
                    }))}
                  />
                </div>
              </The>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-2">
              <The>
                <TieuDeMuc phu="Điểm của chunk tốt nhất mỗi lần hỏi">
                  Phân bố điểm truy hồi
                </TieuDeMuc>
                <div className="mt-4">
                  <CotNgang
                    cacMuc={stats.phanBoScore.map((m) => ({
                      nhan: m.khoang,
                      giaTri: m.soLuong,
                    }))}
                  />
                </div>
              </The>

              <The>
                <TieuDeMuc phu="Đây là bản đồ lỗ hổng của kho dữ liệu">
                  Câu hỏi có điểm thấp nhất
                </TieuDeMuc>
                {stats.cauHoiDiemThap.length > 0 ? (
                  <ul className="mt-3.5 flex flex-col gap-1.5">
                    {stats.cauHoiDiemThap.map((c) => (
                      <li
                        key={`${c.at}-${c.question}`}
                        className="flex items-start gap-3 rounded-[--bo] bg-khay px-3.5 py-2.5 text-sm"
                      >
                        <span className="so-hieu shrink-0 tabular-nums text-nhan">
                          {soVN(c.topScore)}
                        </span>
                        <span className="leading-relaxed">{c.question}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-nhan">Chưa có truy vấn nào được ghi nhận.</p>
                )}
              </The>
            </div>

            {/* ---- Eval: ba biểu đồ nhỏ cùng trục + bảng số ---- */}
            {lanChay.length > 0 ? (
              <The className="flex flex-col gap-5">
                <TieuDeMuc phu="Mỗi lần chạy đổi đúng một biến, nên chênh lệch quy được về nguyên nhân">
                  Các lần đánh giá truy hồi
                </TieuDeMuc>

                <div className="grid gap-6 sm:grid-cols-3">
                  <BieuDoNho
                    tieuDe="Recall@5"
                    cacMuc={lanChay.map((r) => ({
                      nhan: tenNganGon(r.configName),
                      giaTri: r.recallAt5,
                    }))}
                    dinhDang={phanTram}
                  />
                  <BieuDoNho
                    tieuDe="Recall@10"
                    cacMuc={lanChay.map((r) => ({
                      nhan: tenNganGon(r.configName),
                      giaTri: r.recallAt10,
                    }))}
                    dinhDang={phanTram}
                  />
                  <BieuDoNho
                    tieuDe="MRR"
                    cacMuc={lanChay.map((r) => ({
                      nhan: tenNganGon(r.configName),
                      giaTri: r.mrr,
                    }))}
                  />
                </div>

                <div className="-mx-4 overflow-x-auto sm:-mx-5">
                  <table className="w-full min-w-[38rem] text-left text-sm">
                    <thead>
                      <tr className="border-y border-ke-mo">
                        <th className="nhan-hoa px-4 py-2.5 font-semibold sm:px-5">Cấu hình</th>
                        <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Recall@5</th>
                        <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Recall@10</th>
                        <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">MRR</th>
                        <th className="nhan-hoa px-4 py-2.5 text-right font-semibold sm:px-5">
                          Số câu
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lanChay.map((r) => (
                        <tr key={r.id} className="border-b border-ke-mo last:border-0">
                          <td className="px-4 py-2.5 sm:px-5">
                            <span className="so-hieu">{r.configName}</span>
                            {r.notes ? (
                              <span className="mt-0.5 block text-xs leading-relaxed text-nhan">
                                {r.notes}
                              </span>
                            ) : null}
                          </td>
                          <td className="so-hieu px-4 py-2.5 text-right tabular-nums">
                            {phanTram(r.recallAt5)}
                          </td>
                          <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan">
                            {phanTram(r.recallAt10)}
                          </td>
                          <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan">
                            {soVN(r.mrr)}
                          </td>
                          <td className="so-hieu px-4 py-2.5 text-right tabular-nums text-nhan sm:px-5">
                            {r.nQuestions}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </The>
            ) : (
              <TrongRong
                tieuDe="Chưa chạy đánh giá lần nào"
                moTa="Chạy scripts/eval.ts để có con số đầu tiên. Không có bảng này thì hệ thống chỉ là một bản demo chạy được."
              />
            )}
          </section>
        </div>
      ) : null}
    </KhungTrang>
  );
}

async function docJson<T>(r: Response): Promise<T> {
  const d = (await r.json()) as T | { error?: string };
  if (!r.ok) {
    throw new Error(
      ("error" in (d as object) ? (d as { error?: string }).error : null) ??
        "Máy chủ không trả về số liệu.",
    );
  }
  return d as T;
}
