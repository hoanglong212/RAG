"use client";

/**
 * HỒ SƠ — tủ đựng vụ việc, không phải chỗ phân tích.
 *
 * Tất cả giao diện đã được tách thành các component trong `@/components/ho-so`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KhungTrang, Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { ONhap } from "@/components/kit/truong";
import { BaoLoi, BaoTin, TrongRong } from "@/components/kit/trang-thai-kit";
import { docLoi, guiJson, layJson } from "@/components/kit/goi-api";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";
import type {
  LegalCaseView,
  UserProfileView,
  WatchlistView,
} from "@/types/platform";

import { CaseSidebar } from "@/components/ho-so/case-sidebar";
import { CaseDetail } from "@/components/ho-so/case-detail";
import { WatchlistSection } from "@/components/ho-so/watchlist-section";

export default function TrangHoSo() {
  const router = useRouter();
  const [hoSo, setHoSo] = useState<UserProfileView | null>(null);
  const [vuViec, setVuViec] = useState<LegalCaseView[]>([]);
  const [theoDoi, setTheoDoi] = useState<WatchlistView[]>([]);
  const [idDangMo, setIdDangMo] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [tin, setTin] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [xacNhanXoa, setXacNhanXoa] = useState<string | null>(null);

  const lamMoi = useCallback(async () => {
    const [p, c, w] = await Promise.all([
      layJson<UserProfileView>("/api/profile"),
      layJson<LegalCaseView[]>("/api/cases"),
      layJson<WatchlistView[]>("/api/watchlists"),
    ]);
    setHoSo(p);
    setVuViec(c);
    setTheoDoi(w);
    setIdDangMo((hienTai) => hienTai ?? c[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void lamMoi()
      .catch((e: unknown) => setLoi(docLoi(e)))
      .finally(() => setDangTai(false));
  }, [lamMoi]);

  function chay(viec: () => Promise<void>) {
    setLoi(null);
    void viec().catch((e: unknown) => setLoi(docLoi(e)));
  }

  const dangMo = useMemo(
    () => vuViec.find((v) => v.id === idDangMo) ?? null,
    [vuViec, idDangMo],
  );

  return (
    <KhungTrang
      tieuDe="Hồ sơ"
      moTa="Vụ việc đã lưu, giấy tờ sinh ra từ chính căn cứ của nó, và những thay đổi cần theo dõi. Hồ sơ gắn với trình duyệt này bằng một cookie riêng tư — xoá cookie hoặc đổi máy là mất."
      rong="rong"
    >
      <div className="flex flex-col gap-4">
        {tin ? <BaoTin>{tin}</BaoTin> : null}
        {loi ? <BaoLoi moTa={loi} /> : null}

        {/* ================= TỦ HỒ SƠ ================= */}
        <div className="grid gap-3 lg:grid-cols-[20rem_minmax(0,1fr)]">
          {/* Cột trái: gáy hồ sơ */}
          <CaseSidebar
            vuViec={vuViec}
            idDangMo={idDangMo}
            dangTai={dangTai}
            onSelectCase={(id) => setIdDangMo(id)}
          />

          {/* Cột phải: hồ sơ đang mở */}
          <div className="min-w-0">
            {dangMo ? (
              <CaseDetail
                vu={dangMo}
                hoTen={hoSo?.displayName ?? ""}
                xacNhanXoa={xacNhanXoa === dangMo.id}
                onHoiXoa={() => setXacNhanXoa(dangMo.id)}
                onHuyXoa={() => setXacNhanXoa(null)}
                onMoCanCu={(c) => router.push(`/documents/${c.documentId}?node=${c.nodeId}`)}
                onDoiTrangThai={(tt) =>
                  chay(async () => {
                    await guiJson("/api/cases", { id: dangMo.id, status: tt }, "PATCH");
                    setTin(tt === "da_xong" ? "Đã đánh dấu hồ sơ hoàn tất." : "Đã mở lại hồ sơ.");
                    await lamMoi();
                  })
                }
                onXoa={() =>
                  chay(async () => {
                    const r = await fetch(`/api/cases?id=${dangMo.id}`, { method: "DELETE" });
                    if (!r.ok) throw new Error("Không xoá được hồ sơ.");
                    setXacNhanXoa(null);
                    setIdDangMo(null);
                    setTin("Đã xoá hồ sơ.");
                    await lamMoi();
                  })
                }
                onBaoLoi={setLoi}
              />
            ) : !dangTai && vuViec.length > 0 ? (
              <TrongRong
                tieuDe="Chọn một hồ sơ"
                moTa="Bấm một vụ việc ở cột bên trái để mở lại bản phân tích và căn cứ đã lưu."
              />
            ) : null}
          </div>
        </div>

        {/* ================= THEO DÕI ================= */}
        <WatchlistSection
          danhSach={theoDoi}
          onTao={(ten, chuDe) =>
            chay(async () => {
              await guiJson("/api/watchlists", {
                name: ten || NHAN_CHU_DE_TIN[chuDe],
                topics: [chuDe],
                documentIds: [],
              });
              setTin("Đã tạo theo dõi. Từ giờ chỉ báo những gì mới hơn thời điểm này.");
              await lamMoi();
            })
          }
          onDaXem={(id) =>
            chay(async () => {
              await guiJson("/api/watchlists", { id }, "PATCH");
              await lamMoi();
            })
          }
          onXoa={(id) =>
            chay(async () => {
              const r = await fetch(`/api/watchlists?id=${id}`, { method: "DELETE" });
              if (!r.ok) throw new Error("Không xoá được mục theo dõi.");
              setTin("Đã bỏ theo dõi.");
              await lamMoi();
            })
          }
        />

        {/* ================= HỒ SƠ CÁ NHÂN ================= */}
        <The className="flex flex-col gap-4 print:hidden sang-khi-cham">
          <TieuDeMuc phu="Chỉ dùng để điền sẵn vào giấy tờ, không gửi đi đâu">
            Thông tin của bạn
          </TieuDeMuc>
          {hoSo ? (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <ONhap
                value={hoSo.displayName}
                onChange={(e) => setHoSo({ ...hoSo, displayName: e.target.value })}
                placeholder="Họ và tên"
                aria-label="Họ và tên"
              />
              <ONhap
                value={hoSo.email ?? ""}
                onChange={(e) => setHoSo({ ...hoSo, email: e.target.value || null })}
                placeholder="Email (không bắt buộc)"
                aria-label="Email"
              />
              <Nut
                kieu="phu"
                onClick={() =>
                  chay(async () => {
                    const r = await fetch("/api/profile", {
                      method: "PUT",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify(hoSo),
                    });
                    if (!r.ok) throw new Error("Không lưu được thông tin.");
                    setTin("Đã lưu thông tin của bạn.");
                  })
                }
              >
                Lưu
              </Nut>
            </div>
          ) : (
            <p className="text-sm text-nhan">Đang tạo hồ sơ…</p>
          )}
        </The>
      </div>
    </KhungTrang>
  );
}
