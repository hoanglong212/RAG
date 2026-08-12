import { DieuHuong } from "@/components/kit/dieu-huong";

/**
 * Khung chung của mọi trang nhìn thấy được.
 *
 * Thanh trên mỏng và đứng trên khay công cụ; toàn bộ chiều cao còn lại thuộc
 * về nội dung. Không có sidebar điều hướng — trục văn bản mới là thứ chiếm
 * cột trái, và nó thuộc về từng trang chứ không thuộc về khung.
 */
export default function KhungGiaoDien({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-dvh flex-col bg-khay">
      <DieuHuong />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
