"use client";

/**
 * TRANG CHỦ — trang riêng, không phải màn tra cứu nữa.
 *
 * Việc của nó: nói sản phẩm này là gì, chứng minh bằng số đo thật của kho,
 * rồi chỉ đường vào đúng việc người dùng đang cần.
 *
 * Tất cả giao diện đã được tách thành các component chuyên biệt trong `@/components/trang-chu`.
 */

import { useEffect, useState } from "react";
import type { EvalRun, StatsResponse } from "@/types/contract";
import type { NewsArticleSummary } from "@/types/news";
import type { CoverageRow } from "@/types/platform";

import { HeroSection } from "@/components/trang-chu/hero-section";
import { FeatureCards } from "@/components/trang-chu/feature-cards";
import { NewsPreview } from "@/components/trang-chu/news-preview";
import { CoverageChart } from "@/components/trang-chu/coverage-chart";
import { EvalBanner } from "@/components/trang-chu/eval-banner";

export default function TrangChu() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [tin, setTin] = useState<NewsArticleSummary[]>([]);
  const [phuSong, setPhuSong] = useState<CoverageRow[]>([]);
  const [lanChay, setLanChay] = useState<EvalRun[]>([]);

  useEffect(() => {
    const doc = async <T,>(url: string): Promise<T | null> => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return (await r.json()) as T;
      } catch {
        return null;
      }
    };
    void doc<StatsResponse>("/api/stats").then(setStats);
    void doc<{ items: NewsArticleSummary[] }>("/api/news?pageSize=4").then((d) =>
      setTin(d?.items ?? []),
    );
    void doc<CoverageRow[]>("/api/coverage").then((d) => setPhuSong(d ?? []));
    void doc<EvalRun[]>("/api/eval/runs").then((d) => setLanChay(d ?? []));
  }, []);

  const moiNhat = lanChay.at(-1) ?? null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-5 sm:px-6 sm:pt-7">
        {/* ---------- Mở màn ---------- */}
        <HeroSection stats={stats} />

        {/* ---------- Ba lối vào ---------- */}
        <FeatureCards />

        {/* ---------- Tin mới + độ phủ ---------- */}
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <NewsPreview tin={tin} />
          <CoverageChart phuSong={phuSong} />
        </div>

        {/* ---------- Chất lượng đo được ---------- */}
        <EvalBanner moiNhat={moiNhat} />
      </div>
    </div>
  );
}
