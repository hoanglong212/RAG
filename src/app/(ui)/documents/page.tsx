"use client";

/**
 * Kho văn bản.
 *
 * Bảng này là chỗ lộ lỗi tràn khung sớm nhất: tên cơ quan và trích yếu tiếng
 * Việt đều dài. Trích yếu bị kẹp hai dòng, cơ quan bị kẹp một cột hẹp, và số
 * hiệu để mono nên các hàng thẳng cột đọc lướt được.
 *
 * Văn bản có cảnh báo KHÔNG tô đỏ — đỏ chỉ dành cho neo trích dẫn.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DocumentSummary } from "@/types/contract";
import { NHAN_LOAI, NHAN_TRANG_THAI, chuanHoaTenCoQuan } from "@/types/nhan";
import { KhungTrang, Nhan, The } from "@/components/kit/co-ban";
import { BaoLoi, BaoTin, TrongRong, Vach } from "@/components/kit/trang-thai-kit";

interface DocumentsResponse {
  items: DocumentSummary[];
  total: number;
}

export default function TrangKhoVanBan() {
  const [data, setData] = useState<DocumentsResponse>({ items: [], total: 0 });
  const [dangTai, setDangTai] = useState(true);
  const [dangNap, setDangNap] = useState(false);
  const [tin, setTin] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const doc = useCallback(async () => {
    setDangTai(true);
    setLoi(null);
    try {
      const r = await fetch("/api/documents");
      if (!r.ok) throw new Error("Máy chủ không trả về danh sách văn bản.");
      setData((await r.json()) as DocumentsResponse);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không đọc được kho văn bản.");
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => void doc(), [doc]);

  async function nap(file: File) {
    setDangNap(true);
    setTin(null);
    setLoi(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const r = await fetch("/api/ingest", { method: "POST", body: form });
      const kq = (await r.json()) as { error?: string; warnings?: unknown[] };
      if (!r.ok) throw new Error(kq.error ?? "Không nạp được văn bản.");
      const soCanhBao = kq.warnings?.length ?? 0;
      setTin(
        `Đã nạp ${file.name}` +
          (soCanhBao > 0 ? `, có ${soCanhBao} cảnh báo khi bóc tách.` : "."),
      );
      await doc();
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không nạp được văn bản.");
    } finally {
      setDangNap(false);
    }
  }

  const soCoCanhBao = data.items.filter((d) => d.coCanhBao).length;

  return (
    <KhungTrang
      tieuDe="Kho văn bản"
      moTa={
        dangTai
          ? "Đang đọc danh sách…"
          : `${data.total} văn bản đã nạp${soCoCanhBao > 0 ? `, ${soCoCanhBao} văn bản có cảnh báo khi bóc tách` : ""}.`
      }
      hanhDong={
        <label
          className={`inline-flex cursor-pointer items-center rounded-[--bo] bg-but-xanh px-4 py-2 text-sm font-medium text-giay transition-colors duration-[--nhip] hover:bg-but-xanh-sau ${dangNap ? "pointer-events-none opacity-45" : ""}`}
        >
          {dangNap ? "Đang nạp…" : "Nạp văn bản"}
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            disabled={dangNap}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void nap(f);
              e.target.value = "";
            }}
          />
        </label>
      }
    >
      <div className="flex flex-col gap-3">
        {tin ? <BaoTin>{tin}</BaoTin> : null}
        {loi ? <BaoLoi moTa={loi} onThuLai={() => void doc()} /> : null}

        {dangTai ? (
          <The khongDem>
            <div className="flex flex-col gap-px">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-4">
                  <Vach className="w-28 shrink-0" />
                  <Vach className="flex-1" />
                  <Vach className="w-24 shrink-0" />
                </div>
              ))}
            </div>
          </The>
        ) : null}

        {!dangTai && data.items.length === 0 && !loi ? (
          <TrongRong
            tieuDe="Kho chưa có văn bản nào"
            moTa="Nạp một tệp PDF hoặc DOCX có sẵn lớp chữ. Hệ thống sẽ bóc tách Chương, Điều, Khoản rồi mới cho tra cứu."
          />
        ) : null}

        {data.items.length > 0 ? (
          <The khongDem>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ke-mo">
                    <th className="nhan-hoa px-4 py-3 font-semibold">Số hiệu</th>
                    <th className="nhan-hoa px-4 py-3 font-semibold">Trích yếu</th>
                    <th className="nhan-hoa px-4 py-3 font-semibold">Cơ quan</th>
                    <th className="nhan-hoa px-4 py-3 text-right font-semibold">Điều</th>
                    <th className="nhan-hoa px-4 py-3 font-semibold">Hiệu lực</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((vb) => (
                    <tr
                      key={vb.id}
                      className="group border-b border-ke-mo transition-colors duration-[--nhip] last:border-0 hover:bg-khay/60"
                    >
                      <td className="px-4 py-3.5 align-top">
                        <Link
                          href={`/documents/${vb.id}`}
                          className="so-hieu text-but-xanh underline-offset-4 group-hover:underline"
                        >
                          {vb.soHieu ?? "Không có số hiệu"}
                        </Link>
                        <span className="mt-1.5 block text-xs text-nhan">
                          {NHAN_LOAI[vb.loaiVanBan]}
                        </span>
                      </td>
                      <td className="max-w-md px-4 py-3.5 align-top">
                        <Link href={`/documents/${vb.id}`} className="block">
                          <span className="line-clamp-2 leading-relaxed">
                            {vb.trichYeu ?? vb.soHieu ?? "Chưa có trích yếu"}
                          </span>
                        </Link>
                        {vb.coCanhBao ? (
                          <Nhan className="mt-2">Có cảnh báo khi bóc tách</Nhan>
                        ) : null}
                      </td>
                      <td className="max-w-[13rem] px-4 py-3.5 align-top leading-relaxed text-nhan">
                        {chuanHoaTenCoQuan(vb.coQuan)}
                      </td>
                      <td className="so-hieu px-4 py-3.5 text-right align-top text-nhan">
                        {vb.soDieu}
                      </td>
                      <td className="px-4 py-3.5 align-top text-nhan">
                        {NHAN_TRANG_THAI[vb.trangThai]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </The>
        ) : null}

        {data.total > data.items.length ? (
          <p className="text-xs text-nhan">
            Đang hiển thị {data.items.length} văn bản mới nhất trên tổng số {data.total}.
          </p>
        ) : null}
      </div>
    </KhungTrang>
  );
}
