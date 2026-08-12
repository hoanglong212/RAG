"use client";

/**
 * TRỤC VĂN BẢN — yếu tố chữ ký của sản phẩm.
 *
 * Không phải thanh điều hướng. Đây là thước đo văn bản: chiều cao mỗi vạch
 * tỉ lệ với độ dài thật của Điều, nên nhìn một cái là thấy Điều nào nặng,
 * Điều nào chỉ một câu. Một cột mục lục thường không làm được việc đó.
 *
 * BA CHẾ ĐỘ, ĐỔI THEO BỀ NGANG, KHÔNG BAO GIỜ BIẾN MẤT:
 *   < 1024px   dải vạch 56px — mất chữ nhưng giữ nguyên vị trí và dấu đỏ
 *   ≥ 1024px   thêm số Điều
 *   ≥ 1280px   thêm tiêu đề Điều
 *
 * Máy chiếu phòng họp thường 1280×720 và laptop phổ biến 1366×768. Trục mà
 * ẩn đi ở những bề ngang đó thì yếu tố chữ ký của cả dự án không xuất hiện
 * đúng lúc cần nhất. Vì vậy chế độ hẹp là dải vạch chứ không phải `hidden`.
 */

import { useEffect, useMemo, useRef } from "react";
import type { DocNode } from "@/types/contract";
import { NHAN_NODE } from "@/types/nhan";
import { ConDau } from "@/components/kit/con-dau";
import { cn } from "@/lib/utils";

/** Tổng số ký tự của node và toàn bộ con cháu. */
function doDai(node: DocNode): number {
  return node.noiDung.length + node.children.reduce((s, c) => s + doDai(c), 0);
}

/** Đường từ gốc tới node, dùng để quy một Khoản/Điểm về Điều chứa nó. */
function timDuong(tree: DocNode[], id: string): DocNode[] | null {
  for (const node of tree) {
    if (node.id === id) return [node];
    const duoi = timDuong(node.children, id);
    if (duoi) return [node, ...duoi];
  }
  return null;
}

type Hang =
  | { kieu: "nhom"; node: DocNode }
  | { kieu: "dieu"; node: DocNode; canNang: number };

function dungHang(tree: DocNode[]): Hang[] {
  const hang: Hang[] = [];
  for (const node of tree) {
    if (node.type === "dieu") {
      hang.push({ kieu: "dieu", node, canNang: doDai(node) });
      continue;
    }
    hang.push({ kieu: "nhom", node });
    for (const con of node.children) {
      if (con.type === "dieu") {
        hang.push({ kieu: "dieu", node: con, canNang: doDai(con) });
      }
    }
  }
  return hang;
}

const CAO_MIN = 8;
const CAO_MAX = 48;

export interface TrucVanBanProps {
  soHieu: string | null;
  tree: DocNode[];
  /** Node đang được trích dẫn. Có thể là Khoản hoặc Điểm, không nhất thiết là Điều. */
  nodeIdDangNeo: string | null;
  onChon?: (nodeId: string) => void;
  className?: string;
}

export function TrucVanBan({
  soHieu,
  tree,
  nodeIdDangNeo,
  onChon,
  className,
}: TrucVanBanProps) {
  const hang = useMemo(() => dungHang(tree), [tree]);

  const canNangMax = useMemo(
    () => Math.max(1, ...hang.map((h) => (h.kieu === "dieu" ? h.canNang : 0))),
    [hang],
  );

  /** Quy node đang neo (có thể là Khoản) về Điều chứa nó để đánh dấu trên trục. */
  const idDieuDangNeo = useMemo(() => {
    if (!nodeIdDangNeo) return null;
    const duong = timDuong(tree, nodeIdDangNeo);
    if (!duong) return null;
    const dieu = [...duong].reverse().find((n) => n.type === "dieu");
    return (dieu ?? duong[0]).id;
  }, [tree, nodeIdDangNeo]);

  const refDangNeo = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const el = refDangNeo.current;
    if (!el) return;
    const itNhipDieu = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: itNhipDieu ? "auto" : "smooth",
      block: "center",
    });
  }, [idDieuDangNeo]);

  return (
    <nav
      aria-label="Trục văn bản"
      className={cn("flex w-14 flex-col bg-khay lg:w-52 xl:w-72", className)}
    >
      <div className="ke-quoc-hieu mx-2 shrink-0 pb-2.5 pt-3.5 lg:mx-3">
        <p className="nhan-hoa text-center lg:text-left">
          <span className="lg:hidden" title={soHieu ?? "Trục văn bản"}>
            Trục
          </span>
          <span className="hidden lg:inline">Trục văn bản</span>
        </p>
        <p
          className="so-hieu mt-1.5 hidden truncate text-[0.9375rem] font-medium text-muc-in lg:block"
          title={soHieu ?? undefined}
        >
          {soHieu ?? "Không có số hiệu"}
        </p>
      </div>

      <ol className="min-h-0 flex-1 overflow-y-auto pb-6">
        {hang.map((h) => {
          if (h.kieu === "nhom") {
            return (
              <li
                key={h.node.id}
                className="mt-5 border-t-2 border-muc-in/25 px-2 pb-1.5 pt-2.5 first:mt-0 lg:px-3"
              >
                {/* Chế độ hẹp: ranh giới Chương thu thành một vạch ngăn. */}
                <div aria-hidden className="mx-auto h-px w-6 bg-muc-in/30 lg:hidden" />
                <p className="hidden font-semibold text-muc-in lg:block">
                  <span className="nhan-hoa !text-muc-in">
                    {NHAN_NODE[h.node.type]} {h.node.soThuTu}
                  </span>
                </p>
                {h.node.tieuDe ? (
                  <p className="mt-1 hidden text-[0.8125rem] leading-snug text-nhan xl:block">
                    {h.node.tieuDe}
                  </p>
                ) : null}
              </li>
            );
          }

          const dangNeo = h.node.id === idDieuDangNeo;
          const cao = Math.round(
            CAO_MIN + (CAO_MAX - CAO_MIN) * (h.canNang / canNangMax),
          );

          return (
            <li key={h.node.id} ref={dangNeo ? refDangNeo : undefined}>
              <button
                type="button"
                onClick={() => onChon?.(h.node.id)}
                aria-current={dangNeo ? "true" : undefined}
                title={`Điều ${h.node.soThuTu}${h.node.tieuDe ? ` — ${h.node.tieuDe}` : ""}`}
                className={cn(
                  "group relative flex w-full items-start gap-3 py-1.5 text-left",
                  "justify-center px-2 lg:justify-start lg:pl-3 lg:pr-2",
                  "transition-colors duration-[--nhip]",
                  dangNeo ? "bg-neo-vang loe-neo" : "hover:bg-khay-sau",
                )}
              >
                {/* Vạch mật độ: cao tỉ lệ với độ dài Điều. */}
                <span
                  aria-hidden
                  style={{ height: `${cao}px` }}
                  className={cn(
                    "mt-1 w-1 shrink-0 rounded-[1px] transition-colors duration-[--nhip]",
                    dangNeo ? "bg-dau-do vach-neo" : "bg-muc-in/30 group-hover:bg-but-xanh",
                  )}
                />
                {/* Chế độ hẹp: con dấu thu nhỏ đứng cạnh vạch, vì không có chữ. */}
                {dangNeo ? <ConDau co={12} className="mt-1.5 lg:hidden" /> : null}

                <span className="hidden min-w-0 flex-1 items-baseline py-0.5 lg:flex lg:gap-2">
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[0.875rem] font-semibold",
                        dangNeo ? "text-dau-do" : "text-muc-in",
                      )}
                    >
                      Điều <span className="font-ma tabular-nums">{h.node.soThuTu}</span>
                    </span>
                    {h.node.tieuDe ? (
                      <span className="mt-0.5 hidden text-xs leading-snug text-nhan xl:block">
                        {h.node.tieuDe}
                      </span>
                    ) : null}
                  </span>
                  {/* Dấu chứng thực. Chỉ xuất hiện ở đúng chỗ có trích dẫn. */}
                  {dangNeo ? (
                    <ConDau co={20} dangDong className="mt-0.5 shrink-0" />
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
