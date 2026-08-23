"use client";

/**
 * Đo lường — hai khu tách bạch.
 *
 * Khu A nói về BỘ TÀI LIỆU: có gì trong kho.
 * Khu B nói về HỆ THỐNG: nó trả lời tốt tới đâu, và sai ở đâu.
 *
 * Tất cả giao diện đã được tách thành các component trong `@/components/do-luong`.
 */

import { useCallback, useEffect, useState } from "react";
import type { EvalRun, StatsResponse } from "@/types/contract";
import type { CoverageRow } from "@/types/platform";
import { KhungTrang } from "@/components/kit/co-ban";
import { BaoLoi, XuongSoLieu } from "@/components/kit/trang-thai-kit";
import { docLoi, layJson } from "@/components/kit/goi-api";

import { CorpusOverview } from "@/components/do-luong/corpus-overview";
import { QualityMetrics } from "@/components/do-luong/quality-metrics";
import { EvalHistory } from "@/components/do-luong/eval-history";

export default function TrangDoLuong() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [lanChay, setLanChay] = useState<EvalRun[]>([]);
  const [phuSong, setPhuSong] = useState<CoverageRow[]>([]);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(true);

  const doc = useCallback(async () => {
    setDangTai(true);
    setLoi(null);
    try {
      const [s, e, p] = await Promise.all([
        layJson<StatsResponse>("/api/stats"),
        layJson<EvalRun[]>("/api/eval/runs"),
        layJson<CoverageRow[]>("/api/coverage"),
      ]);
      setStats(s);
      setLanChay(e);
      setPhuSong(p);
    } catch (err) {
      setLoi(docLoi(err));
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => void doc(), [doc]);

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
          <CorpusOverview stats={stats} phuSong={phuSong} />

          {/* ============ KHU B ============ */}
          <QualityMetrics stats={stats} lanChay={lanChay} />
          <EvalHistory lanChay={lanChay} />
        </div>
      ) : null}
    </KhungTrang>
  );
}
