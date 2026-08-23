"use client";

import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { Nhan, Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";
import type { LegalCaseView } from "@/types/platform";
import { cn } from "@/lib/utils";

function khiNao(iso: string): string {
  const giay = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (giay < 3600) return `${Math.max(1, Math.floor(giay / 60))} phút trước`;
  if (giay < 86400) return `${Math.floor(giay / 3600)} giờ trước`;
  if (giay < 604800) return `${Math.floor(giay / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function CaseSidebar({
  vuViec,
  idDangMo,
  dangTai,
  onSelectCase,
}: {
  vuViec: LegalCaseView[];
  idDangMo: string | null;
  dangTai: boolean;
  onSelectCase: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <aside className="flex flex-col gap-2 print:hidden">
      <TieuDeMuc phu={dangTai ? undefined : `${vuViec.length} hồ sơ đã lưu`}>
        Vụ việc
      </TieuDeMuc>

      {dangTai ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[--bo-lon] bg-khay-sau" />
          ))}
        </div>
      ) : null}

      {!dangTai && vuViec.length === 0 ? (
        <The className="flex flex-col items-start gap-3 sang-khi-cham">
          <FolderOpen className="size-5 text-nhan" strokeWidth={1.8} />
          <p className="text-sm font-semibold">Chưa có hồ sơ nào</p>
          <p className="text-[0.8125rem] leading-relaxed text-nhan">
            Phân tích một tình huống rồi bấm <em>Lưu vào hồ sơ</em>. Bản phân tích và
            căn cứ của lần chạy đó được giữ nguyên tại đây.
          </p>
          <Nut co="nho" onClick={() => router.push("/legal-check")}>
            Kiểm tra một tình huống
          </Nut>
        </The>
      ) : null}

      <ul className="flex flex-col gap-2">
        {vuViec.map((v) => {
          const mo = v.id === idDangMo;
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onSelectCase(v.id)}
                aria-current={mo ? "true" : undefined}
                className={cn(
                  "w-full rounded-[--bo-lon] p-3.5 text-left transition-all duration-[--nhip]",
                  mo
                    ? "bg-giay shadow-vua ring-2 ring-but-xanh/40"
                    : "bg-giay/60 shadow-the hover:-translate-y-px hover:bg-giay hover:shadow-vua",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      v.status === "da_xong" ? "bg-nhan/50" : "bg-emerald-600 nhip-tho",
                    )}
                  />
                  <span className="nhan-hoa">
                    {v.status === "da_xong" ? "Đã xong" : "Đang làm"}
                  </span>
                  <span className="ml-auto text-xs text-nhan">{khiNao(v.updatedAt)}</span>
                </span>
                <span className="mt-1.5 block line-clamp-2 text-sm font-semibold leading-snug">
                  {v.title}
                </span>
                {v.topic ? (
                  <Nhan className="mt-2">{NHAN_CHU_DE_TIN[v.topic] ?? v.topic}</Nhan>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
