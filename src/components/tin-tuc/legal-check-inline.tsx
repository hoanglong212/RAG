"use client";

import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { TieuDeMuc } from "@/components/kit/co-ban";
import type { LegalCheckResult } from "@/lib/legal/check";
import { NHAN_KET_QUA_PHAP_LY } from "@/types/nhan-news";

export function LegalCheckInline({ doiChieuKq }: { doiChieuKq: LegalCheckResult }) {
  const router = useRouter();

  return (
    <section className="mt-4 border-t border-ke-mo pt-4 hien-len">
      <TieuDeMuc>{NHAN_KET_QUA_PHAP_LY[doiChieuKq.status]}</TieuDeMuc>
      {doiChieuKq.answer ? (
        <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed">
          {doiChieuKq.answer}
        </p>
      ) : null}
      {doiChieuKq.citations.length > 0 ? (
        <div className="mt-3 grid gap-1.5 md:grid-cols-2">
          {doiChieuKq.citations.map((c, i) => (
            <ChipTrichDan
              key={c.chunkId}
              trichDan={c}
              soThuTu={i + 1}
              onChon={() =>
                router.push(`/documents/${c.documentId}?node=${c.nodeId}`)
              }
            />
          ))}
        </div>
      ) : null}
      <p className="mt-3.5 text-xs leading-relaxed text-nhan">
        {doiChieuKq.disclaimer}
      </p>
    </section>
  );
}
