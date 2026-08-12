/**
 * Xem một văn bản, cuộn tới và làm nổi đúng node được trích dẫn.
 * Chạy trên mock cho tới ngày gộp; ngày gộp đổi sang GET /api/documents/[id].
 */

import { notFound } from "next/navigation";
import { chiTietVanBanCoCanhBao, chiTietVanBanDayDu } from "@/mocks/detail";
import { XemVanBan } from "@/components/xem-van-ban";

const KHO = [chiTietVanBanDayDu, chiTietVanBanCoCanhBao];

export default async function TrangChiTietVanBan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chiTiet = KHO.find((vb) => vb.id === id);
  if (!chiTiet) notFound();

  return <XemVanBan chiTiet={chiTiet} />;
}
