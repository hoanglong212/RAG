"use client";

/**
 * Kho văn bản — vừa duyệt vừa hỏi.
 *
 * Tra cứu corpus chuyển về đây từ trang chủ cũ: hỏi "điều kiện cấp giấy
 * chứng nhận là gì" và lật xem kho có những văn bản nào là CÙNG một việc,
 * chỉ khác đường vào. Tách chúng ra hai trang buộc người dùng đoán xem câu
 * hỏi của mình thuộc loại nào trước khi được phép hỏi.
 *
 * Chưa hỏi gì thì cột giữa là danh sách để duyệt. Hỏi rồi thì nó thành câu
 * trả lời, kèm trục văn bản bên trái và mặt đọc bên phải.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import type { DocumentSummary } from "@/types/contract";
import { NHAN_LOAI, NHAN_TRANG_THAI, chuanHoaTenCoQuan } from "@/types/nhan";
import { BanTraCuu } from "@/components/tra-cuu/ban-tra-cuu";
import { Nhan } from "@/components/kit/co-ban";
import { BaoLoi, BaoTin, TrongRong, Vach } from "@/components/kit/trang-thai-kit";
import { docLoi, docPhanHoi, layJson } from "@/components/kit/goi-api";

interface DocumentsResponse {
  items: DocumentSummary[];
  total: number;
}

const CAU_HOI_GOI_Y = [
  "Công ty chậm trả tiền lương cho người lao động thì bị xử lý thế nào?",
  "Người đi xe máy vượt đèn đỏ bị phạt theo quy định nào?",
  "Cửa hàng từ chối bảo hành sản phẩm lỗi có đúng pháp luật không?",
];

export default function TrangKhoVanBan() {
  return (
    <BanTraCuu
      cheDo="corpus"
      khiTrong={(chonCauHoi) => <DuyetKho onChonCauHoi={chonCauHoi} />}
    />
  );
}

function DuyetKho({ onChonCauHoi }: { onChonCauHoi: (cau: string) => void }) {
  const [data, setData] = useState<DocumentsResponse>({ items: [], total: 0 });
  const [dangTai, setDangTai] = useState(true);
  const [dangNap, setDangNap] = useState(false);
  const [tin, setTin] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const doc = useCallback(async () => {
    setDangTai(true);
    setLoi(null);
    try {
      setData(await layJson<DocumentsResponse>("/api/documents"));
    } catch (e) {
      setLoi(docLoi(e));
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
      const kq = await docPhanHoi<{ warnings?: unknown[] }>(r, "/api/ingest");
      const soCanhBao = kq.warnings?.length ?? 0;
      setTin(
        `Đã nạp ${file.name}` +
          (soCanhBao > 0 ? `, có ${soCanhBao} cảnh báo khi bóc tách.` : "."),
      );
      await doc();
    } catch (e) {
      setLoi(docLoi(e));
    } finally {
      setDangNap(false);
    }
  }

  const soCoCanhBao = data.items.filter((d) => d.coCanhBao).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Gợi ý câu hỏi đứng trước danh sách: hỏi là đường vào nhanh hơn duyệt. */}
      <section>
        <p className="nhan-hoa">Hỏi thẳng trong kho</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {CAU_HOI_GOI_Y.map((cau) => (
            <li key={cau}>
              <button
                type="button"
                onClick={() => onChonCauHoi(cau)}
                className="rounded-full bg-giay px-3.5 py-2 text-left text-xs font-medium text-nhan shadow-[inset_0_0_0_1px_var(--ke-mo)] transition-[color,transform,box-shadow] duration-[--nhip] hover:-translate-y-px hover:text-muc-in hover:shadow-the"
              >
                {cau}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-ke-mo pt-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Toàn bộ kho</h2>
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-nhan">
            {dangTai
              ? "Đang đọc danh sách…"
              : `${data.total} văn bản${soCoCanhBao > 0 ? `, ${soCoCanhBao} có cảnh báo khi bóc tách` : ""}.`}
          </p>
        </div>
        <label
          className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[--bo] bg-but-xanh px-4 py-2 text-sm font-medium text-giay transition-colors duration-[--nhip] hover:bg-but-xanh-sau ${dangNap ? "pointer-events-none opacity-45" : ""}`}
        >
          <Upload className="size-4" strokeWidth={1.9} />
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
      </div>

      {tin ? <BaoTin>{tin}</BaoTin> : null}
      {loi ? <BaoLoi moTa={loi} onThuLai={() => void doc()} /> : null}

      {dangTai ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="rounded-[--bo-lon] bg-giay p-4 shadow-the">
              <Vach className="w-32" />
              <Vach className="mt-3 h-4 w-3/4" />
              <Vach className="mt-2.5 w-1/2" />
            </div>
          ))}
        </div>
      ) : null}

      {!dangTai && data.items.length === 0 && !loi ? (
        <TrongRong
          tieuDe="Kho chưa có văn bản nào"
          moTa="Nạp một tệp PDF hoặc DOCX có sẵn lớp chữ. Hệ thống bóc tách Chương, Điều, Khoản rồi mới cho tra cứu."
        />
      ) : null}

      {data.items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {data.items.map((vb) => (
            <li key={vb.id}>
              <Link
                href={`/documents/${vb.id}`}
                className="block rounded-[--bo-lon] bg-giay p-4 shadow-the ring-1 ring-muc-in/[0.045] transition-[box-shadow,transform] duration-[--nhip] hover:-translate-y-px hover:shadow-vua"
              >
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="so-hieu text-but-xanh">
                    {vb.soHieu ?? "Không có số hiệu"}
                  </span>
                  <span className="text-xs text-nhan">{NHAN_LOAI[vb.loaiVanBan]}</span>
                </div>

                <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-relaxed">
                  {vb.trichYeu ?? vb.soHieu ?? "Chưa có trích yếu"}
                </p>

                <p className="mt-2 text-xs leading-relaxed text-nhan">
                  {chuanHoaTenCoQuan(vb.coQuan)} · {vb.soDieu} Điều ·{" "}
                  {NHAN_TRANG_THAI[vb.trangThai]}
                </p>

                {vb.coCanhBao ? (
                  <Nhan className="mt-2">Có cảnh báo khi bóc tách</Nhan>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {data.total > data.items.length ? (
        <p className="text-xs text-nhan">
          Đang hiển thị {data.items.length} văn bản mới nhất trên tổng số {data.total}.
        </p>
      ) : null}
    </div>
  );
}
