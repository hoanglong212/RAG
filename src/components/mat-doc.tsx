"use client";

/**
 * Mặt đọc — vùng DUY NHẤT trong sản phẩm hiển thị văn bản gốc, và vùng duy
 * nhất dùng serif. Nền giấy, chữ serif, dòng thoáng; mọi thứ bao quanh nó là
 * khay công cụ. Ranh giới đó chính là luận điểm thiết kế.
 */

import { useEffect, useRef } from "react";
import type { DocNode } from "@/types/contract";
import { NHAN_NODE } from "@/types/nhan";
import { cn } from "@/lib/utils";

function NodeVanBan({
  node,
  nodeIdDangNeo,
  refNeo,
}: {
  node: DocNode;
  nodeIdDangNeo: string | null;
  refNeo: React.RefObject<HTMLDivElement | null>;
}) {
  const dangNeo = node.id === nodeIdDangNeo;

  const noiDung = (() => {
    switch (node.type) {
      case "chuong":
      case "muc":
        return (
          <h2 className="nhan-hoa mt-8 first:mt-0">
            {NHAN_NODE[node.type]} {node.soThuTu}
            {node.tieuDe ? ` — ${node.tieuDe}` : ""}
          </h2>
        );
      case "phu_luc":
        return (
          <>
            <h2 className="nhan-hoa mt-8">
              {NHAN_NODE.phu_luc} {node.soThuTu}
            </h2>
            {node.tieuDe ? (
              <h3 className="mt-1 font-sans text-base font-semibold">{node.tieuDe}</h3>
            ) : null}
            {node.noiDung ? <p className="mt-2">{node.noiDung}</p> : null}
          </>
        );
      case "dieu":
        return (
          <>
            <h3 className="mt-6 font-sans text-base font-semibold">
              Điều {node.soThuTu}
              {node.tieuDe ? `. ${node.tieuDe}` : ""}
            </h3>
            {node.noiDung ? <p className="mt-2">{node.noiDung}</p> : null}
          </>
        );
      case "khoan":
        return (
          <p className="mt-3">
            <span className="font-semibold">{node.soThuTu}. </span>
            {node.noiDung}
          </p>
        );
      case "diem":
        return (
          <p className="mt-2 pl-6">
            <span className="font-semibold">{node.soThuTu}) </span>
            {node.noiDung}
          </p>
        );
    }
  })();

  return (
    <div
      id={`node-${node.id}`}
      ref={dangNeo ? refNeo : undefined}
      className={cn(
        "scroll-mt-6 transition-colors duration-[--nhip-cham]",
        // Nền vàng nhạt + kẻ đỏ: cùng hệ nghĩa với chấm đỏ trên chip trích dẫn.
        dangNeo && "-mx-3 border-l-2 border-dau-do bg-neo-vang px-3 py-1",
      )}
    >
      {noiDung}
      {node.children.map((con) => (
        <NodeVanBan
          key={con.id}
          node={con}
          nodeIdDangNeo={nodeIdDangNeo}
          refNeo={refNeo}
        />
      ))}
    </div>
  );
}

export interface MatDocProps {
  tree: DocNode[];
  nodeIdDangNeo: string | null;
  className?: string;
}

export function MatDoc({ tree, nodeIdDangNeo, className }: MatDocProps) {
  const refNeo = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = refNeo.current;
    if (!el) return;
    const itNhipDieu = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: itNhipDieu ? "auto" : "smooth", block: "center" });
  }, [nodeIdDangNeo]);

  return (
    <article className={cn("mat-doc overflow-y-auto px-6 py-6", className)}>
      <div className="mx-auto max-w-[68ch]">
        {tree.map((node) => (
          <NodeVanBan
            key={node.id}
            node={node}
            nodeIdDangNeo={nodeIdDangNeo}
            refNeo={refNeo}
          />
        ))}
      </div>
    </article>
  );
}
