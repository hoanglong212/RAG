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
import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  FileSearch,
  FolderOpen,
  Home,
  Library,
  Landmark,
  Menu,
  Newspaper,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import { KhayCongCu } from "@/components/kit/khay-cong-cu";
import { cn } from "@/lib/utils";

const CHINH = [
  { href: "/", nhan: "Trang chủ", moTa: "Tổng quan kho và chất lượng", icon: Home },
  { href: "/documents", nhan: "Kho văn bản", moTa: "Duyệt và hỏi trong corpus", icon: Library },
  { href: "/nghien-cuu", nhan: "Nghiên cứu sâu", moTa: "Gom thêm nguồn ngoài kho", icon: FileSearch },
  { href: "/legal-check", nhan: "Kiểm tra tình huống", moTa: "Đối chiếu sự việc với luật", icon: Scale },
  { href: "/workspace", nhan: "Hồ sơ", moTa: "Theo dõi và tạo biểu mẫu", icon: FolderOpen },
  { href: "/news", nhan: "Tin tức", moTa: "Tin mới và căn cứ liên quan", icon: Newspaper },
] as const;
// "Công cụ" không còn là một trang: ba dụng cụ của nó nằm trong KhayCongCu
// trên chính thanh này. Xem components/cong-cu/bo-cong-cu.tsx.

const HE_THONG = [
  { href: "/dashboard", nhan: "Đo lường", moTa: "Độ phủ và chất lượng", icon: BarChart3 },
  { href: "/admin", nhan: "Quản trị", moTa: "Vận hành hệ thống", icon: ShieldCheck },
] as const;

function dangMo(duongDan: string, href: string): boolean {
  return href === "/" ? duongDan === "/" : duongDan.startsWith(href);
}

function Muc({
  href,
  nhan,
  mo,
  icon: Icon,
}: {
  href: string;
  nhan: string;
  mo: boolean;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <Link
      href={href}
      aria-current={mo ? "page" : undefined}
      className={cn(
        "group relative shrink-0 rounded-[--bo] px-3 py-2 text-[0.8125rem] font-medium",
        "transition-[background-color,color,transform] duration-[--nhip]",
        mo
          ? "bg-giay text-muc-in shadow-vua"
          : "text-giay/60 hover:-translate-y-px hover:bg-giay/10 hover:text-giay",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className={cn("size-3.5", mo ? "text-but-xanh" : "text-giay/45 group-hover:text-giay")} strokeWidth={1.8} />
        {nhan}
      </span>
    </Link>
  );
}

function MucDiDong({
  href,
  nhan,
  moTa,
  mo,
  icon: Icon,
}: {
  href: string;
  nhan: string;
  moTa: string;
  mo: boolean;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <Link
      href={href}
      aria-current={mo ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-[--bo-lon] px-3 py-3",
        "transition-[background-color,transform] duration-[--nhip] active:translate-y-px",
        mo ? "bg-but-xanh-nhat" : "hover:bg-khay",
      )}
    >
      <span className={cn(
        "grid size-10 shrink-0 place-items-center rounded-[--bo]",
        mo ? "bg-but-xanh text-giay shadow-vua" : "bg-khay text-but-xanh",
      )}>
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-muc-in">{nhan}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-nhan">{moTa}</span>
      </span>
      <span aria-hidden className="text-lg text-nhan transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

export function DieuHuong() {
  const duongDan = usePathname();
  const [moMenu, setMoMenu] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const nutMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMoMenu(false), [duongDan]);

  useEffect(() => {
    if (!moMenu) return;
    const nutMoMenu = nutMenuRef.current;
    const truocDo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dauTien = menuRef.current?.querySelector<HTMLElement>("button, a[href]");
    dauTien?.focus();

    const dongBangEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMoMenu(false);
    };
    document.addEventListener("keydown", dongBangEscape);
    return () => {
      document.removeEventListener("keydown", dongBangEscape);
      (truocDo ?? nutMoMenu)?.focus();
    };
  }, [moMenu]);

  const giuFocusTrongMenu = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const cacMuc = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
    );
    if (cacMuc.length === 0) return;
    const dau = cacMuc[0];
    const cuoi = cacMuc[cacMuc.length - 1];
    if (event.shiftKey && document.activeElement === dau) {
      event.preventDefault();
      cuoi.focus();
    } else if (!event.shiftKey && document.activeElement === cuoi) {
      event.preventDefault();
      dau.focus();
    }
  };

  return (
    <>
      <header className="relative z-50 flex h-16 shrink-0 items-center gap-4 bg-muc-in px-4 shadow-noi sm:px-5">
        <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="Trang tra cứu">
          <span className="grid size-9 place-items-center rounded-[--bo] bg-giay text-but-xanh shadow-vua transition-transform duration-[--nhip] group-hover:-translate-y-px">
            <Landmark className="size-5" strokeWidth={1.8} />
          </span>
          <span className="hidden xl:block">
            <span className="block text-sm font-semibold tracking-[-0.01em] text-giay">Tra cứu văn bản</span>
            <span className="nhan-hoa-sang mt-0.5 block">
              Hành chính Việt Nam
            </span>
          </span>
        </Link>

        <span aria-hidden className="hidden h-7 w-px bg-giay/15 xl:block" />

        <nav aria-label="Điều hướng chính" className="hidden min-w-0 flex-1 items-center gap-0.5 xl:flex">
          {CHINH.map((m) => (
            <Muc key={m.href} href={m.href} nhan={m.nhan} icon={m.icon} mo={dangMo(duongDan, m.href)} />
          ))}
          <span aria-hidden className="mx-1.5 h-5 w-px shrink-0 bg-giay/20" />
          {HE_THONG.map((m) => (
            <Muc key={m.href} href={m.href} nhan={m.nhan} icon={m.icon} mo={dangMo(duongDan, m.href)} />
          ))}
          <div className="ml-auto">
            <KhayCongCu />
          </div>
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2 xl:hidden">
          {/* Khay công cụ có mặt ở cả màn hình hẹp — trên cảm ứng nó mở bằng
              cú bấm, nên không bị mất như một menu chỉ dùng hover. */}
          <KhayCongCu />
          {/* Tên sản phẩm phải chịu co: không có min-w-0 + truncate thì nó đẩy
              nút menu ra ngoài mép màn hình 375px. Dưới 640px thì ẩn hẳn —
              logo đã nhận diện đủ, và ba nút công cụ cần chỗ hơn. */}
          <span className="hidden min-w-0 truncate text-sm font-semibold text-giay sm:block">
            Tra cứu văn bản
          </span>
          <button
            ref={nutMenuRef}
            type="button"
            aria-label={moMenu ? "Đóng menu" : "Mở menu"}
            aria-expanded={moMenu}
            aria-hidden={moMenu ? true : undefined}
            tabIndex={moMenu ? -1 : undefined}
            onClick={() => setMoMenu((v) => !v)}
            className="grid size-10 place-items-center rounded-[--bo] bg-giay/10 text-giay transition-colors hover:bg-giay/15"
          >
            {moMenu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {moMenu ? (
        <div className="fixed inset-0 top-16 z-40 bg-muc-in/35 xl:hidden" onClick={() => setMoMenu(false)}>
          <nav
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Điều hướng di động"
            className="h-full max-h-[calc(100dvh-4rem)] overflow-y-auto bg-giay px-4 py-5 shadow-noi hien-len"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={giuFocusTrongMenu}
          >
            <div className="mx-auto max-w-lg">
              <div className="mb-4 flex items-center gap-3 border-b border-ke-mo pb-4">
                <BriefcaseBusiness className="size-5 shrink-0 text-but-xanh" strokeWidth={1.8} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Bàn làm việc pháp lý</p>
                  <p className="text-xs text-nhan">Chọn tác vụ bạn muốn tiếp tục</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoMenu(false)}
                  className="grid size-10 shrink-0 place-items-center rounded-[--bo] bg-khay text-muc-in transition-colors hover:bg-khay-sau"
                  aria-label="Đóng menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                {[...CHINH, ...HE_THONG].map((m) => (
                  <MucDiDong key={m.href} {...m} mo={dangMo(duongDan, m.href)} />
                ))}
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
