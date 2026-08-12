"use client";

/**
 * Thanh điều hướng — dải mực đen ở đỉnh màn hình.
 *
 * Nền tối là chủ ý, và nó không phải bẫy thẩm mỹ "nền gần đen + một màu chói":
 * thân trang vẫn là giấy sáng. Dải mực này đóng vai trò cái gáy của công văn —
 * nó cho sản phẩm một mép cứng ở trên, và làm ba tầng nền bên dưới (bàn, khay,
 * giấy) đọc ra được thành ba tầng thật thay vì ba sắc xám na ná nhau.
 *
 * Mục đang mở được NHẤC HẲN khỏi dải mực thành một thẻ giấy trắng. Cùng phép
 * ẩn dụ với toàn bộ sản phẩm: dụng cụ đang cầm thì rời khỏi khay đựng.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConDau } from "./con-dau";
import { cn } from "@/lib/utils";

const CHINH = [
  { href: "/", nhan: "Tra cứu" },
  { href: "/legal-check", nhan: "Kiểm tra tình huống" },
  { href: "/workspace", nhan: "Hồ sơ" },
  { href: "/documents", nhan: "Kho văn bản" },
  { href: "/news", nhan: "Tin tức" },
  { href: "/legal-tools", nhan: "Công cụ" },
] as const;

const HE_THONG = [
  { href: "/dashboard", nhan: "Đo lường" },
  { href: "/admin", nhan: "Quản trị" },
] as const;

function dangMo(duongDan: string, href: string): boolean {
  return href === "/" ? duongDan === "/" : duongDan.startsWith(href);
}

function Muc({ href, nhan, mo }: { href: string; nhan: string; mo: boolean }) {
  return (
    <Link
      href={href}
      aria-current={mo ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-[--bo] px-3 py-1.5 text-[0.8125rem] font-medium",
        "transition-[background-color,color] duration-[--nhip]",
        mo
          ? "bg-giay text-muc-in shadow-vua"
          : "text-giay/60 hover:bg-giay/10 hover:text-giay",
      )}
    >
      {nhan}
    </Link>
  );
}

export function DieuHuong() {
  const duongDan = usePathname();

  return (
    <header className="flex shrink-0 items-center gap-3 bg-muc-in px-3 py-2.5 sm:px-4">
      <Link
        href="/"
        className="group flex shrink-0 items-center gap-2.5 pr-2"
        aria-label="Trang tra cứu"
      >
        <ConDau co={22} className="transition-transform duration-[--nhip-cham] group-hover:rotate-[5deg]" />
        <span className="hidden text-sm font-semibold tracking-[-0.01em] text-giay sm:block">
          Tra cứu văn bản
        </span>
      </Link>

      <nav
        aria-label="Điều hướng chính"
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]"
      >
        {CHINH.map((m) => (
          <Muc key={m.href} href={m.href} nhan={m.nhan} mo={dangMo(duongDan, m.href)} />
        ))}

        <span aria-hidden className="mx-2 h-4 w-px shrink-0 bg-giay/20" />

        {HE_THONG.map((m) => (
          <Muc key={m.href} href={m.href} nhan={m.nhan} mo={dangMo(duongDan, m.href)} />
        ))}
      </nav>
    </header>
  );
}
