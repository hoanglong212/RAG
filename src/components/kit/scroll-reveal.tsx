"use client";

/**
 * Scroll Reveal Component.
 *
 * Tự động thêm class .da-hien khi phần tử được cuộn vào viewport sử dụng IntersectionObserver.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ScrollReveal({
  children,
  className,
  delayMs = 0,
  hieuUng = "truot-len",
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  hieuUng?: "truot-len" | "phong-len";
}) {
  const [daHien, setDaHien] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Nếu người dùng bật reduced motion, hiển thị ngay
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDaHien(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDaHien(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delayMs}ms` }}
      className={cn(
        "transition-all",
        daHien
          ? hieuUng === "phong-len"
            ? "phong-len"
            : "da-hien"
          : "cho-hien",
        className
      )}
    >
      {children}
    </div>
  );
}
