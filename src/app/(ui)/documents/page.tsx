"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DocumentSummary } from "@/types/contract";
import { NHAN_LOAI, NHAN_TRANG_THAI } from "@/types/nhan";

interface DocumentsResponse {
  items: DocumentSummary[];
  total: number;
}

export default function TrangKhoVanBan() {
  const [data, setData] = useState<DocumentsResponse>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Không đọc được kho văn bản.");
      setData((await response.json()) as DocumentsResponse);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không đọc được kho văn bản.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  async function upload(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/ingest", { method: "POST", body: form });
      const result = (await response.json()) as { error?: string; warnings?: unknown[] };
      if (!response.ok) throw new Error(result.error ?? "Không nạp được văn bản.");
      setMessage(`Đã nạp ${file.name}${result.warnings?.length ? `, có ${result.warnings.length} cảnh báo` : ""}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không nạp được văn bản.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Kho văn bản</h1>
            <p className="mt-1 text-sm text-nhan">{data.total} văn bản đã nạp.</p>
          </div>
          <label className="cursor-pointer rounded-[--bo] bg-but-xanh px-3.5 py-2 text-sm font-medium text-giay">
            {uploading ? "Đang nạp…" : "Nạp văn bản"}
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              disabled={uploading}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {message ? <p className="mt-3 rounded-[--bo] bg-khay-sau px-3 py-2 text-sm text-nhan">{message}</p> : null}
        {loading ? <p className="mt-8 text-sm text-nhan">Đang đọc kho văn bản…</p> : null}

        {!loading && data.items.length === 0 ? (
          <p className="mt-8 text-sm text-nhan">Chưa có văn bản nào.</p>
        ) : null}

        {data.items.length > 0 ? (
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
                {data.items.map((document) => (
                  <tr key={document.id} className="border-b border-ke-mo last:border-0">
                    <td className="px-4 py-3 align-top">
                      <Link href={`/documents/${document.id}`} className="so-hieu text-but-xanh hover:underline">
                        {document.soHieu ?? "Không có số hiệu"}
                      </Link>
                      <span className="mt-1 block text-xs text-nhan">{NHAN_LOAI[document.loaiVanBan]}</span>
                    </td>
                    <td className="max-w-md px-4 py-3 align-top">
                      <span className="line-clamp-2 leading-snug">{document.trichYeu ?? document.soHieu}</span>
                      {document.coCanhBao ? (
                        <span className="mt-1 inline-block rounded-[--bo] bg-khay px-1.5 py-0.5 text-xs text-nhan">
                          Có cảnh báo khi bóc tách
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[14rem] px-4 py-3 align-top leading-snug text-nhan">{document.coQuan}</td>
                    <td className="so-hieu px-4 py-3 text-right align-top text-nhan">{document.soDieu}</td>
                    <td className="px-4 py-3 align-top text-nhan">{NHAN_TRANG_THAI[document.trangThai]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {data.total > data.items.length ? (
          <p className="mt-3 text-xs text-nhan">Đang hiển thị 20 văn bản mới nhất.</p>
        ) : null}
      </div>
    </div>
  );
}
