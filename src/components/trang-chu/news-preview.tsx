"use client";

import Link from "next/link";
import type { NewsArticleSummary } from "@/types/news";
import { The, TieuDeMuc } from "@/components/kit/co-ban";
import { Vach } from "@/components/kit/trang-thai-kit";

export function NewsPreview({ tin }: { tin: NewsArticleSummary[] }) {
  return (
    <The className="flex flex-col gap-4">
      <TieuDeMuc
        phu="Tin từ báo trong nước, đối chiếu được với căn cứ trong kho"
        hanhDong={
          <Link
            href="/news"
            className="group flex items-center gap-1 text-[0.8125rem] font-medium text-but-xanh underline-offset-4 hover:underline"
          >
            <span>Xem tất cả</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        }
      >
        <span className="flex items-center gap-2">
          <span>Đang diễn ra</span>
          <span className="size-2 rounded-full bg-emerald-500 nhip-tho" />
        </span>
      </TieuDeMuc>

      {tin.length > 0 ? (
        <ul className="flex flex-col gap-3.5">
          {tin.slice(0, 4).map((bai) => (
            <li key={bai.id}>
              <a
                href={bai.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start gap-3 rounded-lg p-1.5 transition-colors hover:bg-khay/60"
              >
                {bai.imageUrl ? (
                  <span className="shrink-0 overflow-hidden rounded-[--bo] bg-khay">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bai.imageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-16 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const boc = e.currentTarget.parentElement;
                        if (boc) boc.style.display = "none";
                      }}
                    />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="inline-block rounded bg-khay px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-nhan">
                    {bai.source.name}
                  </span>
                  <span className="mt-1 block line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-but-xanh">
                    {bai.title}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Vach className="size-16 shrink-0 rounded-lg" />
              <div className="flex-1">
                <Vach className="w-20" />
                <Vach className="mt-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}
    </The>
  );
}
