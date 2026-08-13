"use client";

/**
 * HỒ SƠ — tủ đựng vụ việc, không phải chỗ phân tích.
 *
 * Trước đây trang này có ô phân tích riêng, gọi cùng một hàm với trang Kiểm
 * tra tình huống rồi thêm hai danh sách gợi ý cứng. Cùng một việc làm ở hai
 * chỗ, và bản ở đây luôn là bản cũ hơn. Giờ phân tích ở trang kia, nút "Lưu
 * vào hồ sơ" đưa kết quả sang đây, và đây lo phần mà không trang nào khác
 * lo: GIỮ LẠI và LÀM TIẾP.
 *
 * Ba việc làm tiếp, xếp theo vòng đời một vụ việc:
 *   mở lại hồ sơ đã lưu  →  sinh giấy tờ từ chính căn cứ đó  →  theo dõi
 *   xem có văn bản hay tin gì mới động tới nó không
 *
 * Bản in giữ lại hồ sơ đang mở; mọi nút bấm đều print:hidden.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  FileText,
  FolderOpen,
  Printer,
  Trash2,
} from "lucide-react";
import { KhungTrang, Nhan, Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { ONhap, OChon, OVanBan } from "@/components/kit/truong";
import { BaoLoi, BaoTin, TrongRong } from "@/components/kit/trang-thai-kit";
import { docLoi, guiJson, layJson } from "@/components/kit/goi-api";
import { PhanTichTinhHuong } from "@/components/phan-tich-tinh-huong";
import { DanhSachCanCu } from "@/components/danh-sach-can-cu";
import type { NewsTopic } from "@/types/news";
import { NHAN_CHU_DE_TIN } from "@/types/nhan-news";
import type {
  LegalCaseView,
  UserProfileView,
  WatchlistView,
} from "@/types/platform";
import { cn } from "@/lib/utils";

const CHU_DE: NewsTopic[] = [
  "an_toan_thuc_pham",
  "lao_dong",
  "giao_thong",
  "dat_dai_nha_o",
  "nguoi_tieu_dung",
];

const MAU_DON = [
  { id: "complaint", nhan: "Đơn khiếu nại" },
  { id: "warranty", nhan: "Yêu cầu bảo hành" },
  { id: "salary", nhan: "Yêu cầu thanh toán lương" },
] as const;

function khiNao(iso: string): string {
  const giay = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (giay < 3600) return `${Math.max(1, Math.floor(giay / 60))} phút trước`;
  if (giay < 86400) return `${Math.floor(giay / 3600)} giờ trước`;
  if (giay < 604800) return `${Math.floor(giay / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

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
          {/* ---- Cột trái: gáy hồ sơ ---- */}
          <aside className="flex flex-col gap-2 print:hidden">
            <TieuDeMuc phu={dangTai ? undefined : `${vuViec.length} hồ sơ đã lưu`}>
              Vụ việc
            </TieuDeMuc>

            {dangTai ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-[--bo-lon] bg-khay-sau" />
                ))}
              </div>
            ) : null}

            {!dangTai && vuViec.length === 0 ? (
              <The className="flex flex-col items-start gap-3">
                <FolderOpen className="size-5 text-nhan" strokeWidth={1.8} />
                <p className="text-sm font-semibold">Chưa có hồ sơ nào</p>
                <p className="text-[0.8125rem] leading-relaxed text-nhan">
                  Phân tích một tình huống rồi bấm <em>Lưu vào hồ sơ</em>. Bản phân tích và
                  căn cứ của lần chạy đó được giữ nguyên tại đây.
                </p>
                <Nut co="nho" onClick={() => router.push("/legal-check")}>
                  Kiểm tra một tình huống
                </Nut>
              </The>
            ) : null}

            <ul className="flex flex-col gap-2">
              {vuViec.map((v) => {
                const mo = v.id === dangMo?.id;
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => setIdDangMo(v.id)}
                      aria-current={mo ? "true" : undefined}
                      className={cn(
                        "w-full rounded-[--bo-lon] p-3.5 text-left transition-[box-shadow,transform,background-color] duration-[--nhip]",
                        mo
                          ? "bg-giay shadow-vua ring-1 ring-but-xanh/25"
                          : "bg-giay/60 shadow-the hover:-translate-y-px hover:bg-giay hover:shadow-vua",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            v.status === "da_xong" ? "bg-nhan/50" : "bg-but-xanh",
                          )}
                        />
                        <span className="nhan-hoa">
                          {v.status === "da_xong" ? "Đã xong" : "Đang làm"}
                        </span>
                        <span className="ml-auto text-xs text-nhan">{khiNao(v.updatedAt)}</span>
                      </span>
                      <span className="mt-1.5 block line-clamp-2 text-sm font-medium leading-snug">
                        {v.title}
                      </span>
                      {v.topic ? (
                        <Nhan className="mt-2">{NHAN_CHU_DE_TIN[v.topic] ?? v.topic}</Nhan>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* ---- Cột phải: hồ sơ đang mở ---- */}
          <div className="min-w-0">
            {dangMo ? (
              <HoSoDangMo
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
        <TheoDoiThayDoi
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
        <The className="flex flex-col gap-4 print:hidden">
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

/* ------------------------------------------------------------------ */
/* Hồ sơ đang mở                                                       */

function HoSoDangMo({
  vu,
  hoTen,
  xacNhanXoa,
  onHoiXoa,
  onHuyXoa,
  onXoa,
  onDoiTrangThai,
  onMoCanCu,
  onBaoLoi,
}: {
  vu: LegalCaseView;
  hoTen: string;
  xacNhanXoa: boolean;
  onHoiXoa: () => void;
  onHuyXoa: () => void;
  onXoa: () => void;
  onDoiTrangThai: (tt: "dang_lam" | "da_xong") => void;
  onMoCanCu: (c: { documentId: string; nodeId: string }) => void;
  onBaoLoi: (s: string) => void;
}) {
  const pt = vu.analysis?.phanTich ?? null;
  const canCu = vu.analysis?.citations ?? [];

  return (
    <div className="flex flex-col gap-3">
      <The className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="nhan-hoa">
              Lưu {khiNao(vu.createdAt)} · Sửa {khiNao(vu.updatedAt)}
            </p>
            <h2 className="mt-1.5 text-lg font-semibold leading-snug">{vu.title}</h2>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">
            <Nut
              kieu={vu.status === "da_xong" ? "vien" : "phu"}
              co="nho"
              onClick={() => onDoiTrangThai(vu.status === "da_xong" ? "dang_lam" : "da_xong")}
            >
              {vu.status === "da_xong" ? "Mở lại" : "Đánh dấu xong"}
            </Nut>
            <Nut kieu="vien" co="nho" onClick={() => window.print()}>
              <Printer className="size-3.5" strokeWidth={1.9} />
              In
            </Nut>
            {xacNhanXoa ? (
              <>
                <Nut kieu="phu" co="nho" onClick={onXoa}>
                  Xoá thật
                </Nut>
                <Nut kieu="lang" co="nho" onClick={onHuyXoa}>
                  Thôi
                </Nut>
              </>
            ) : (
              <Nut kieu="lang" co="nho" onClick={onHoiXoa}>
                <Trash2 className="size-3.5" strokeWidth={1.9} />
                Xoá
              </Nut>
            )}
          </div>
        </div>

        <div>
          <p className="nhan-hoa">Sự việc đã ghi lại</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-nhan">
            {vu.scenario}
          </p>
        </div>
      </The>

      {pt ? (
        <PhanTichTinhHuong phanTich={pt} citations={canCu} onMoCanCu={onMoCanCu} />
      ) : vu.analysis?.answer ? (
        <The>
          <TieuDeMuc>Phân tích đã lưu</TieuDeMuc>
          <p className="mt-2.5 whitespace-pre-wrap text-base leading-[--dong-body]">
            {vu.analysis.answer}
          </p>
        </The>
      ) : null}

      {canCu.length > 0 ? (
        <The>
          <TieuDeMuc phu="Ảnh chụp tại thời điểm lưu, không đổi theo kho văn bản">
            Căn cứ đã lưu ({canCu.length})
          </TieuDeMuc>
          <div className="mt-2.5">
            <DanhSachCanCu citations={canCu} onMo={onMoCanCu} />
          </div>
        </The>
      ) : null}

      <SoanGiayTo vu={vu} hoTen={hoTen} onBaoLoi={onBaoLoi} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Soạn giấy tờ từ chính hồ sơ                                         */

function SoanGiayTo({
  vu,
  hoTen,
  onBaoLoi,
}: {
  vu: LegalCaseView;
  hoTen: string;
  onBaoLoi: (s: string) => void;
}) {
  const [maDon, setMaDon] = useState<string>("complaint");
  const [noiNhan, setNoiNhan] = useState("");
  const [yeuCau, setYeuCau] = useState("");
  const [banNhap, setBanNhap] = useState("");
  const [dangChay, setDangChay] = useState(false);

  /* Căn cứ của hồ sơ đi thẳng vào mục "Tài liệu kèm theo" của lá đơn — đây
     chính là chỗ việc lưu hồ sơ trả công: không phải gõ lại điều khoản nào. */
  const kemTheo = (vu.analysis?.citations ?? []).map(
    (c) => `${c.soHieu} — ${c.breadcrumb}`,
  );

  async function sinhDon() {
    setDangChay(true);
    try {
      const kq = await guiJson<{ text: string }>("/api/templates", {
        templateId: maDon,
        attachments: kemTheo,
        fields: {
          fullName: hoTen,
          recipient: noiNhan,
          seller: noiNhan,
          employer: noiNhan,
          address: "",
          facts: vu.scenario,
          product: vu.scenario.slice(0, 120),
          period: vu.scenario.slice(0, 120),
          request: yeuCau,
        },
      });
      setBanNhap(kq.text);
    } catch (e) {
      onBaoLoi(docLoi(e));
    } finally {
      setDangChay(false);
    }
  }

  return (
    <The className="flex flex-col gap-4 print:hidden">
      <TieuDeMuc phu={`Sự việc và ${kemTheo.length} căn cứ của hồ sơ này được điền sẵn`}>
        Soạn giấy tờ từ hồ sơ
      </TieuDeMuc>

      <div className="grid gap-2 sm:grid-cols-3">
        <OChon value={maDon} onChange={(e) => setMaDon(e.target.value)} aria-label="Loại đơn">
          {MAU_DON.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nhan}
            </option>
          ))}
        </OChon>
        <ONhap
          value={noiNhan}
          onChange={(e) => setNoiNhan(e.target.value)}
          placeholder="Nơi nhận hoặc bên liên quan"
          aria-label="Nơi nhận"
        />
        <ONhap
          value={yeuCau}
          onChange={(e) => setYeuCau(e.target.value)}
          placeholder="Yêu cầu của bạn"
          aria-label="Yêu cầu"
        />
      </div>

      <div className="flex justify-end">
        <Nut kieu="phu" disabled={dangChay} onClick={() => void sinhDon()}>
          <FileText className="size-4" strokeWidth={1.9} />
          {dangChay ? "Đang soạn…" : "Tạo bản nháp"}
        </Nut>
      </div>

      {banNhap ? (
        <div className="flex flex-col gap-2">
          <OVanBan readOnly rows={14} value={banNhap} className="font-ma text-xs" />
          <div className="flex flex-wrap justify-end gap-2">
            <Nut
              kieu="vien"
              co="nho"
              onClick={() => void navigator.clipboard?.writeText(banNhap)}
            >
              Sao chép
            </Nut>
          </div>
          <p className="text-xs leading-relaxed text-nhan">
            Bản nháp hỗ trợ soạn thảo. Hãy kiểm tra lại thẩm quyền nơi nhận, thông tin cá
            nhân và hồ sơ kèm theo trước khi gửi.
          </p>
        </div>
      ) : null}
    </The>
  );
}

/* ------------------------------------------------------------------ */
/* Theo dõi thay đổi                                                   */

function TheoDoiThayDoi({
  danhSach,
  onTao,
  onDaXem,
  onXoa,
}: {
  danhSach: WatchlistView[];
  onTao: (ten: string, chuDe: NewsTopic) => void;
  onDaXem: (id: string) => void;
  onXoa: (id: string) => void;
}) {
  const [ten, setTen] = useState("");
  const [chuDe, setChuDe] = useState<NewsTopic>("giao_thong");

  return (
    <The className="flex flex-col gap-4 print:hidden">
      <TieuDeMuc phu="Báo khi có văn bản hoặc tin mới thuộc chủ đề bạn chọn">
        Theo dõi thay đổi
      </TieuDeMuc>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <ONhap
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          placeholder="Đặt tên, ví dụ: Xe máy của tôi"
          aria-label="Tên theo dõi"
        />
        <OChon
          value={chuDe}
          onChange={(e) => setChuDe(e.target.value as NewsTopic)}
          aria-label="Chủ đề theo dõi"
        >
          {CHU_DE.map((t) => (
            <option key={t} value={t}>
              {NHAN_CHU_DE_TIN[t]}
            </option>
          ))}
        </OChon>
        <Nut
          onClick={() => {
            onTao(ten.trim(), chuDe);
            setTen("");
          }}
        >
          Theo dõi
        </Nut>
      </div>

      {danhSach.length === 0 ? (
        <p className="text-sm leading-relaxed text-nhan">
          Chưa theo dõi gì. Tạo một mục để biết khi nào có văn bản hoặc tin mới động tới
          lĩnh vực bạn quan tâm.
        </p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {danhSach.map((t) => (
            <li key={t.id} className="rounded-[--bo] bg-khay p-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {t.alerts.length > 0 ? (
                    <BellRing className="size-3.5 text-but-xanh" strokeWidth={2} />
                  ) : null}
                  {t.name}
                </span>
                <span className="text-xs text-nhan">
                  {t.alerts.length > 0 ? `${t.alerts.length} mục mới` : "Chưa có gì mới"}
                </span>
              </div>

              {t.alerts.slice(0, 3).map((c) => (
                <a
                  key={`${c.kind}-${c.id}`}
                  href={c.href}
                  className="mt-1.5 block line-clamp-1 text-xs text-nhan underline-offset-4 hover:text-but-xanh hover:underline"
                >
                  {c.kind === "news" ? "Tin" : "Văn bản"}: {c.title}
                </a>
              ))}

              <div className="mt-3 flex flex-wrap gap-2">
                {t.alerts.length > 0 ? (
                  <Nut kieu="vien" co="nho" onClick={() => onDaXem(t.id)}>
                    Đánh dấu đã xem
                  </Nut>
                ) : null}
                <Nut kieu="lang" co="nho" onClick={() => onXoa(t.id)}>
                  Bỏ theo dõi
                </Nut>
              </div>
            </li>
          ))}
        </ul>
      )}
    </The>
  );
}
