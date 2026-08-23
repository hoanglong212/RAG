"use client";

/**
 * Vòng tròn tiến trình SVG (Radial Progress Ring).
 *
 * Dùng cho chỉ số Recall@5, score confidence hoặc các tỷ lệ phần trăm.
 * Vẽ mượt bằng stroke-dashoffset và CSS transition.
 */

import { cn } from "@/lib/utils";

export function VongTienTrinh({
  phanTram,
  co = 64,
  doDay = 5,
  mauNen = "rgba(255,255,255,0.15)",
  mauVach = "var(--giay)",
  nhan,
  className,
}: {
  phanTram: number; // 0..1 (hoặc 0..100)
  co?: number;
  doDay?: number;
  mauNen?: string;
  mauVach?: string;
  nhan?: string;
  className?: string;
}) {
  // Chuẩn hóa phanTram về [0..1]
  const val = phanTram > 1 ? phanTram / 100 : Math.max(0, Math.min(1, phanTram));
  const banKinh = (co - doDay) / 2;
  const chuVi = 2 * Math.PI * banKinh;
  const offset = chuVi * (1 - val);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: co, height: co }}
    >
      <svg width={co} height={co} className="-rotate-90 transform">
        <circle
          cx={co / 2}
          cy={co / 2}
          r={banKinh}
          stroke={mauNen}
          strokeWidth={doDay}
          fill="none"
        />
        <circle
          cx={co / 2}
          cy={co / 2}
          r={banKinh}
          stroke={mauVach}
          strokeWidth={doDay}
          fill="none"
          strokeDasharray={chuVi}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {nhan ? (
        <span className="absolute text-xs font-semibold tabular-nums">
          {nhan}
        </span>
      ) : null}
    </div>
  );
}
