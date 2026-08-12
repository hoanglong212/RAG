/**
 * Kho văn bản.
 *
 * Chạy trên mock cho tới ngày gộp. Bảng này là chỗ lộ lỗi tràn khung sớm nhất:
 * tên cơ quan dài và trích yếu dài đều có sẵn trong mock.
 *
 * Lưu ý kỷ luật màu: văn bản có cảnh báo KHÔNG được tô đỏ. Đỏ chỉ dành cho
 * neo trích dẫn.
 */

import Link from "next/link";
import { mockDocuments } from "@/mocks/documents";
import { NHAN_LOAI, NHAN_TRANG_THAI } from "@/types/nhan";

export default function TrangKhoVanBan() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-lg font-semibold">Kho văn bản</h1>
        <p className="mt-1 text-sm text-nhan">
          {mockDocuments.length} văn bản đã nạp.
        </p>

        {mockDocuments.length === 0 ? (
          <p className="mt-8 text-sm text-nhan">
            Chưa có văn bản nào. Nạp tệp PDF hoặc DOCX để bắt đầu tra cứu.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-[--bo-lon] bg-giay">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ke-mo">
                  <th className="nhan-hoa px-4 py-2.5 font-semibold">Số hiệu</th>
                  <th className="nhan-hoa px-4 py-2.5 font-semibold">Trích yếu</th>
                  <th className="nhan-hoa px-4 py-2.5 font-semibold">Cơ quan</th>
                  <th className="nhan-hoa px-4 py-2.5 text-right font-semibold">Điều</th>
                  <th className="nhan-hoa px-4 py-2.5 font-semibold">Hiệu lực</th>
                </tr>
              </thead>
              <tbody>
                {mockDocuments.map((vb) => (
                  <tr key={vb.id} className="border-b border-ke-mo last:border-0">
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/documents/${vb.id}`}
                        className="so-hieu text-but-xanh hover:underline"
                      >
                        {vb.soHieu ?? "Không có số hiệu"}
                      </Link>
                      <span className="mt-1 block text-xs text-nhan">
                        {NHAN_LOAI[vb.loaiVanBan]}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3 align-top">
                      <span className="line-clamp-2 leading-snug">{vb.trichYeu}</span>
                      {vb.coCanhBao ? (
                        <span className="mt-1 inline-block rounded-[--bo] bg-khay px-1.5 py-0.5 text-xs text-nhan">
                          Có cảnh báo khi bóc tách
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[14rem] px-4 py-3 align-top leading-snug text-nhan">
                      {vb.coQuan}
                    </td>
                    <td className="so-hieu px-4 py-3 text-right align-top text-nhan">
                      {vb.soDieu}
                    </td>
                    <td className="px-4 py-3 align-top text-nhan">
                      {NHAN_TRANG_THAI[vb.trangThai]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
