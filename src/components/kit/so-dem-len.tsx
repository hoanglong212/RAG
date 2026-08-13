"use client";

/**
 * Số chạy lên tới giá trị cuối.
 *
 * NGUYÊN TẮC: con số ĐÚNG là mặc định, hoạt ảnh chỉ là phần thêm.
 *
 * Bản trước khởi tạo ở 0 rồi trông chờ requestAnimationFrame đưa nó lên. Mà
 * rAF không chạy khi tab nằm ở nền hoặc trang không được vẽ, và một lá cờ
 * `daChay` lại chặn mọi lần thử lại — nên mở trang ở tab nền là thấy "0 văn
 * bản trong kho" đứng nguyên, trong khi kho có 61. Hiển thị sai số liệu là
 * hỏng nặng hơn nhiều so với mất một hiệu ứng.
 *
 * Giờ state bắt đầu ở giá trị thật. Chỉ khi chắc chắn vẽ được mới lùi về 0 và
 * chạy lên. Hỏng ở bất kỳ khâu nào thì người dùng vẫn đọc đúng số.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SoDemLen({
  denSo,
  thoiGian = 1200,
  dinhDang,
  className,
}: {
  /** Giá trị cuối cùng. */
  denSo: number;
  /** Thời gian chạy (ms). Mặc định 1.2s. */
  thoiGian?: number;
  /** Hàm format hiển thị, mặc định toLocaleString("vi-VN"). */
  dinhDang?: (n: number) => string;
  className?: string;
}) {
  // Mặc định là số thật, không phải 0.
  const [hienThi, setHienThi] = useState(denSo);
  const daChayCho = useRef<number | null>(null);

  useEffect(() => {
    // Mỗi giá trị mới chỉ được chạy hoạt ảnh một lần.
    if (daChayCho.current === denSo) return;

    const khongNenChay =
      denSo <= 0 ||
      typeof window === "undefined" ||
      document.visibilityState !== "visible" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (khongNenChay) {
      daChayCho.current = denSo;
      setHienThi(denSo);
      return;
    }

    daChayCho.current = denSo;
    let id = 0;
    const batDau = performance.now();
    setHienThi(0);

    function buoc(now: number) {
      const tienTrinh = Math.min((now - batDau) / thoiGian, 1);
      // Ease-out-cubic: nhanh đầu, chậm cuối.
      const eased = 1 - Math.pow(1 - tienTrinh, 3);
      setHienThi(Math.round(eased * denSo));
      if (tienTrinh < 1) id = requestAnimationFrame(buoc);
    }
    id = requestAnimationFrame(buoc);

    // Rời trang giữa chừng thì chốt luôn số thật, không để treo ở giá trị dở.
    return () => {
      cancelAnimationFrame(id);
      setHienThi(denSo);
    };
  }, [denSo, thoiGian]);

  const format = dinhDang ?? ((n: number) => n.toLocaleString("vi-VN"));

  return <span className={cn("tabular-nums", className)}>{format(hienThi)}</span>;
}
