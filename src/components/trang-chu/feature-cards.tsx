"use client";

import Link from "next/link";
import { ArrowRight, Library, Scale, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const LOI_VAO = [
  {
    href: "/documents",
    nhan: "Hỏi trong kho văn bản",
    moTa: "Câu trả lời neo về đúng Điều, Khoản, mở được văn bản gốc ngay cạnh.",
    icon: Library,
    colorClass: "bg-blue-500/10 text-but-xanh group-hover:bg-but-xanh group-hover:text-giay",
  },
  {
    href: "/nghien-cuu",
    nhan: "Nghiên cứu sâu",
    moTa: "Gom thêm nguồn ngoài kho rồi đối chiếu ngược lại với căn cứ trong kho.",
    icon: Sparkles,
    colorClass: "bg-amber-500/10 text-amber-700 group-hover:bg-amber-600 group-hover:text-giay",
  },
  {
    href: "/legal-check",
    nhan: "Kiểm tra tình huống",
    moTa: "Mô tả sự việc bằng lời thường, hệ thống chỉ ra quy định liên quan.",
    icon: Scale,
    colorClass: "bg-emerald-500/10 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-giay",
  },
] as const;

export function FeatureCards() {
  return (
    <section className="mt-5 grid gap-3 md:grid-cols-3">
      {LOI_VAO.map((m, idx) => (
        <Link
          key={m.href}
          href={m.href}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-[--bo-lon] bg-giay p-5 shadow-the ring-1 ring-muc-in/[0.045]",
            "transition-all duration-[--nhip-cham] hover:-translate-y-1 hover:shadow-vua sang-khi-cham",
            idx === 0 && "tre-1",
            idx === 1 && "tre-2",
            idx === 2 && "tre-3"
          )}
        >
          <div className="flex items-start justify-between">
            <div className={cn("grid size-10 place-items-center rounded-lg transition-colors duration-300", m.colorClass)}>
              <m.icon className="size-5" strokeWidth={1.9} />
            </div>
            <ArrowRight
              aria-hidden
              className="size-5 text-nhan/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-but-xanh"
              strokeWidth={2}
            />
          </div>

          <div className="mt-5">
            <h2 className="text-base font-semibold text-muc-in group-hover:text-but-xanh transition-colors">
              {m.nhan}
            </h2>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-nhan">
              {m.moTa}
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}
