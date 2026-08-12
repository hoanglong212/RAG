"use client";

/**
 * TRỤC VĂN BẢN — yếu tố chữ ký của sản phẩm.
 *
 * Không phải thanh điều hướng. Đây là thước đo văn bản: chiều cao mỗi vạch
 * tỉ lệ với độ dài thật của Điều, nên nhìn một cái là thấy Điều nào nặng,
 * Điều nào chỉ một câu. Một cột mục lục thường không làm được việc đó.
 *
 * Trục là chỗ dồn toàn bộ độ táo bạo của thiết kế. Nếu tới cuối dự án nó vẫn
 * đứng yên và trông như một danh sách, phần này đã hỏng.
 */

import { useEffect, useMemo, useRef } from "react";
import type { DocNode } from "@/types/contract";
import { NHAN_NODE } from "@/types/nhan";
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
  moRong?: boolean;
  onChon?: (nodeId: string) => void;
  className?: string;
}

export function TrucVanBan({
  soHieu,
  tree,
  nodeIdDangNeo,
  moRong = false,
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
      className={cn(
        "flex flex-col overflow-hidden bg-khay transition-[width] duration-[--nhip]",
        moRong ? "w-80" : "w-52",
        className,
      )}
    >
      <div className="shrink-0 px-3 pb-2 pt-3">
        <p className="nhan-hoa">Trục văn bản</p>
        <p className="so-hieu mt-1 truncate text-muc-in" title={soHieu ?? undefined}>
          {soHieu ?? "Không có số hiệu"}
        </p>
      </div>

      <ol className="min-h-0 flex-1 overflow-y-auto pb-6">
        {hang.map((h) => {
          if (h.kieu === "nhom") {
            return (
              <li key={h.node.id} className="px-3 pb-1 pt-4">
                <p className="nhan-hoa">
                  {NHAN_NODE[h.node.type]} {h.node.soThuTu}
                </p>
                {h.node.tieuDe ? (
                  <p className="mt-0.5 text-[0.8125rem] leading-snug text-nhan">
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
                className={cn(
                  "group flex w-full items-start gap-2.5 py-1 pl-3 pr-2 text-left",
                  "transition-colors duration-[--nhip]",
                  dangNeo ? "bg-khay-sau" : "hover:bg-khay-sau",
                )}
              >
                {/* Vạch mật độ: cao tỉ lệ với độ dài Điều. */}
                <span
                  aria-hidden
                  style={{ height: `${cao}px` }}
                  className={cn(
                    "mt-1 w-[3px] shrink-0 rounded-[1px] transition-colors duration-[--nhip]",
                    dangNeo ? "bg-dau-do" : "bg-nhan/35 group-hover:bg-but-xanh/60",
                  )}
                />
                <span className="min-w-0 flex-1 py-0.5">
                  <span
                    className={cn(
                      "block text-[0.8125rem] font-medium",
                      dangNeo ? "text-dau-do" : "text-muc-in",
                    )}
                  >
                    Điều {h.node.soThuTu}
                    {dangNeo ? (
                      // Dấu chứng thực. Chỉ xuất hiện ở đúng chỗ có trích dẫn.
                      <span aria-label="Đang trích dẫn" className="ml-1.5 text-dau-do">
                        ●
                      </span>
                    ) : null}
                  </span>
                  {moRong && h.node.tieuDe ? (
                    <span className="mt-0.5 block text-xs leading-snug text-nhan">
                      {h.node.tieuDe}
                    </span>
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
