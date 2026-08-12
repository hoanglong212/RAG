"use client";

import { ExternalLink, FileText, Landmark, Library } from "lucide-react";
import type { ResearchSource } from "@/types/research";
import { cn } from "@/lib/utils";

export function NguonNghienCuu({
  source,
  index,
  selected = false,
  onSelect,
}: {
  source: ResearchSource;
  index: number;
  selected?: boolean;
  onSelect: () => void;
}) {
  const official = source.kind === "official_web";
  const corpus = source.kind === "corpus";
  const Icon = corpus ? Library : official ? Landmark : FileText;
  const label = corpus ? "Kho nội bộ" : official ? "Nguồn chính thức" : "Nguồn tham khảo";
  const className = cn(
    "group flex w-full items-start gap-3 rounded-[--bo] bg-giay px-3 py-3 text-left shadow-the",
    "transition-[box-shadow,transform] duration-[--nhip] hover:-translate-y-px hover:shadow-vua",
    selected && "shadow-noi [box-shadow:inset_0_0_0_1px_var(--dau-do),var(--do-noi)]",
  );
  const content = (
    <>
      <span className="relative grid size-9 shrink-0 place-items-center rounded-[--bo] bg-but-xanh-nhat text-but-xanh">
        <Icon className="size-4" strokeWidth={1.8} />
        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-dau-do font-ma text-[0.625rem] font-semibold text-giay">
          {index}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-but-xanh">{label}</span>
          {source.domain ? <span className="so-hieu text-[0.6875rem] text-nhan">{source.domain}</span> : null}
        </span>
        <span className="mt-1 block text-[0.8125rem] font-semibold leading-snug text-muc-in">{source.title}</span>
        <span className="mt-1.5 block line-clamp-2 text-xs leading-relaxed text-nhan">{source.excerpt}</span>
      </span>
      {!corpus ? <ExternalLink className="mt-1 size-4 shrink-0 text-nhan transition-colors group-hover:text-but-xanh" /> : null}
    </>
  );

  return corpus ? (
    <button type="button" className={className} onClick={onSelect}>{content}</button>
  ) : (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className={className} onClick={onSelect}>{content}</a>
  );
}

