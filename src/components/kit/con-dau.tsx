/**
 * CON DẤU — dấu ấn thị giác của sản phẩm.
 *
 * Brief nói lấy chất liệu từ thế giới vật chất của công văn: con dấu đỏ tròn,
 * mực loang, đóng đè lên chữ ký. Trước đây tôi chỉ viết điều đó trong chú
 * thích rồi vẽ một chấm tròn 6px — nói mà không làm.
 *
 * Đây là con dấu thật: hai vòng đồng tâm, ngôi sao ở giữa, đóng lệch một góc,
 * và một lớp mực loang mờ lệch khỏi tâm đúng như dấu đóng tay không bao giờ
 * chồng khít.
 *
 * KỶ LUẬT: nó là hiện thân của --dau-do, nên nó CHỈ được xuất hiện ở nơi có
 * neo trích dẫn thật. Không dùng làm hoa văn trang trí, không dùng cho cảnh
 * báo, không rắc lên trang cho đẹp.
 */

import { cn } from "@/lib/utils";

export function ConDau({
  co = 20,
  soThuTu,
  dangDong = false,
  className,
}: {
  co?: number;
  /** Số trích dẫn in giữa dấu. Bỏ trống thì in ngôi sao. */
  soThuTu?: number;
  /** Bật hoạt ảnh nện dấu, dùng khi trích dẫn vừa về. */
  dangDong?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block shrink-0", dangDong && "dong-dau", className)}
      style={{ width: co, height: co, transform: dangDong ? undefined : "rotate(-7deg)" }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" className="size-full overflow-visible">
        {/* Mực loang: bản sao lệch tâm, mờ — dấu đóng tay không bao giờ khít. */}
        <circle
          cx="21.4"
          cy="21"
          r="17"
          fill="none"
          stroke="var(--dau-do-loang)"
          strokeWidth="3.4"
          opacity="0.34"
        />
        {/* Vòng ngoài. */}
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="var(--dau-do)"
          strokeWidth="2.6"
        />
        {/* Vòng trong. */}
        <circle
          cx="20"
          cy="20"
          r="12.6"
          fill="none"
          stroke="var(--dau-do)"
          strokeWidth="1.1"
          opacity="0.75"
        />
        {soThuTu === undefined ? (
          // Ngôi sao năm cánh giữa dấu.
          <path
            d="M20 10.4l2.75 5.57 6.15.9-4.45 4.34 1.05 6.12L20 24.44l-5.5 2.89 1.05-6.12-4.45-4.34 6.15-.9z"
            fill="var(--dau-do)"
          />
        ) : (
          <text
            x="20"
            y="20"
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--dau-do)"
            style={{
              font: `600 ${soThuTu > 9 ? 13 : 15}px var(--chu-ma)`,
            }}
          >
            {soThuTu}
          </text>
        )}
      </svg>
    </span>
  );
}
