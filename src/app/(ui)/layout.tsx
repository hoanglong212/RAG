import Link from "next/link";

/**
 * Khung chung của mọi trang nhìn thấy được.
 *
 * Thanh trên mỏng và đứng trên khay công cụ; toàn bộ chiều cao còn lại thuộc
 * về nội dung. Không có sidebar điều hướng — trục văn bản mới là thứ chiếm
 * cột trái, và nó thuộc về từng trang chứ không thuộc về khung.
 */

const DIEU_HUONG = [
  { href: "/", nhan: "Tra cứu" },
  { href: "/documents", nhan: "Kho văn bản" },
  { href: "/dashboard", nhan: "Đo lường" },
] as const;

export default function KhungGiaoDien({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-dvh flex-col bg-khay">
      <header className="flex shrink-0 items-center gap-1 px-4 py-2.5">
        <span className="mr-4 text-sm font-semibold tracking-tight">
          Tra cứu văn bản
        </span>
        <nav className="flex items-center gap-1" aria-label="Điều hướng chính">
          {DIEU_HUONG.map((muc) => (
            <Link
              key={muc.href}
              href={muc.href}
              className="rounded-[--bo] px-2.5 py-1.5 text-sm text-nhan transition-colors duration-[--nhip] hover:bg-khay-sau hover:text-muc-in"
            >
              {muc.nhan}
            </Link>
          ))}
        </nav>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
