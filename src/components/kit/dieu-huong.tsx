"use client";

/**
 * Thanh điều hướng.
 *
 * Tám mục dàn hàng ngang như trước là quá nhiều để quét bằng mắt, và khi hẹp
 * thì chúng xuống dòng làm thanh trên cao gấp đôi. Ở đây chia hai nhóm theo
 * việc người dùng làm — tra cứu và tra soát bên trái, vận hành hệ thống đẩy
 * sang phải — và cuộn ngang thay vì xuống dòng.
 *
 * Mục đang mở được nhấc khỏi khay: nền giấy + bóng nhẹ. Cùng một phép ẩn dụ
 * với toàn bộ sản phẩm — dụng cụ đang cầm thì nổi lên khỏi khay đựng.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
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
        "shrink-0 rounded-[--bo] px-2.5 py-1.5 text-[0.8125rem] font-medium",
        "transition-[background-color,color,box-shadow] duration-[--nhip]",
        mo
          ? "bg-giay text-muc-in shadow-the"
          : "text-nhan hover:bg-khay-sau hover:text-muc-in",
      )}
    >
      {nhan}
    </Link>
  );
}

export function DieuHuong() {
  const duongDan = usePathname();

  return (
    <header className="flex shrink-0 items-center gap-3 px-3 py-2 sm:px-4">
      <Link href="/" className="group flex shrink-0 items-center gap-2 pr-1">
        {/* Dấu mực: hình vuông xoay, gợi con dấu đóng lệch trên công văn. */}
        <span
          aria-hidden
          className="size-2.5 rotate-45 rounded-[1px] bg-muc-in transition-transform duration-[--nhip-cham] group-hover:rotate-[135deg]"
        />
        <span className="text-sm font-semibold tracking-[-0.01em]">Tra cứu văn bản</span>
      </Link>

      <nav
        aria-label="Điều hướng chính"
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]{display:none}"
      >
        {CHINH.map((m) => (
          <Muc key={m.href} href={m.href} nhan={m.nhan} mo={dangMo(duongDan, m.href)} />
        ))}

        <span aria-hidden className="mx-1.5 h-4 w-px shrink-0 bg-ke-mo" />

        {HE_THONG.map((m) => (
          <Muc key={m.href} href={m.href} nhan={m.nhan} mo={dangMo(duongDan, m.href)} />
        ))}
      </nav>
    </header>
  );
}
