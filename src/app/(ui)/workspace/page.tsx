"use client";

/**
 * Không gian hồ sơ — chỗ người dùng giữ việc của mình qua nhiều lần vào.
 *
 * Bốn dụng cụ, xếp theo thứ tự người ta thật sự dùng: phân tích tình huống
 * trước, rồi lưu lại, rồi theo dõi thay đổi, rồi mới soạn đơn. Hồ sơ cá nhân
 * đẩy xuống cuối vì nó là việc làm một lần.
 *
 * Bản in chỉ giữ phần phân tích: nút bấm, bộ lọc và ô nhập đều `print:hidden`.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChipTrichDan } from "@/components/chip-trich-dan";
import { KhungTrang, Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { ONhap, OChon, OVanBan, Truong, VienLoc } from "@/components/kit/truong";
import { BaoLoi, BaoTin } from "@/components/kit/trang-thai-kit";
import type { NewsTopic } from "@/types/news";
import { NHAN_CHU_DE_TIN, NHAN_KET_QUA_PHAP_LY } from "@/types/nhan-news";
import type {
  CaseAnalysis,
  LegalCaseView,
  UserProfileView,
  WatchlistView,
} from "@/types/platform";

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

export default function TrangKhongGianLamViec() {
  const router = useRouter();
  const [hoSo, setHoSo] = useState<UserProfileView | null>(null);
  const [vuViec, setVuViec] = useState<LegalCaseView[]>([]);
  const [theoDoi, setTheoDoi] = useState<WatchlistView[]>([]);
  const [tinhHuong, setTinhHuong] = useState("");
  const [chuDe, setChuDe] = useState<NewsTopic | "">("");
  const [phanTich, setPhanTich] = useState<CaseAnalysis | null>(null);
  const [tenTheoDoi, setTenTheoDoi] = useState("");
  const [chuDeTheoDoi, setChuDeTheoDoi] = useState<NewsTopic>("giao_thong");
  const [maDon, setMaDon] = useState<string>("complaint");
  const [truong, setTruong] = useState({
    fullName: "",
    address: "",
    recipient: "",
    facts: "",
    request: "",
  });
  const [banNhap, setBanNhap] = useState("");
  const [dangChay, setDangChay] = useState(false);
  const [tin, setTin] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const lamMoi = useCallback(async () => {
    const [p, c, w] = await Promise.all([
      layJson<UserProfileView>("/api/profile"),
      layJson<LegalCaseView[]>("/api/cases"),
      layJson<WatchlistView[]>("/api/watchlists"),
    ]);
    setHoSo(p);
    setVuViec(c);
    setTheoDoi(w);
  }, []);

  useEffect(() => {
    void lamMoi().catch((e: unknown) => setLoi(docLoi(e)));
  }, [lamMoi]);

  function chay(viec: () => Promise<void>) {
    setLoi(null);
    void viec().catch((e: unknown) => setLoi(docLoi(e)));
  }

  async function phanTichHoSo() {
    setDangChay(true);
    setTin(null);
    try {
      setPhanTich(
        await guiJson<CaseAnalysis>("/api/cases/analyze", {
          scenario: tinhHuong,
          ...(chuDe ? { topic: chuDe } : {}),
        }),
      );
    } finally {
      setDangChay(false);
    }
  }

  return (
    <KhungTrang
      tieuDe="Không gian hồ sơ"
      moTa="Hồ sơ gắn với trình duyệt hiện tại bằng một cookie riêng tư. Không có tài khoản, không có mật khẩu."
      rong="rong"
    >
      <div className="flex flex-col gap-3">
        {loi ? <BaoLoi moTa={loi} /> : null}
        {tin ? <BaoTin>{tin}</BaoTin> : null}

        {/* ---------- Phân tích tình huống ---------- */}
        <The className="flex flex-col gap-4">
          <TieuDeMuc phu="Mô tả càng đủ dữ kiện, hệ thống càng chỉ ra được chỗ bạn còn thiếu">
            Hồ sơ tình huống
          </TieuDeMuc>

          <OVanBan
            rows={6}
            value={tinhHuong}
            onChange={(e) => setTinhHuong(e.target.value)}
            placeholder="Mô tả đầy đủ sự việc: xảy ra khi nào, giữa những ai, đã làm gì rồi…"
          />

          <div className="flex flex-col gap-3 print:hidden">
            <VienLoc
              cacMuc={CHU_DE.map((t) => ({ giaTri: t, nhan: NHAN_CHU_DE_TIN[t] }))}
              dangChon={chuDe}
              nhanTatCa="Tự nhận diện chủ đề"
              onChon={setChuDe}
            />
            <div className="flex justify-end">
              <Nut
                disabled={dangChay || tinhHuong.trim().length < 10}
                onClick={() => chay(phanTichHoSo)}
              >
                {dangChay ? "Đang phân tích…" : "Phân tích hồ sơ"}
              </Nut>
            </div>
          </div>

          {phanTich ? (
            <div className="flex flex-col gap-5 border-t border-ke-mo pt-5">
              <h3 className="text-base font-semibold">
                {NHAN_KET_QUA_PHAP_LY[phanTich.status]}
              </h3>

              {phanTich.answer ? (
                <p className="whitespace-pre-wrap text-[0.9375rem] leading-[--dong-body]">
                  {phanTich.answer}
                </p>
              ) : null}

              <div className="grid gap-5 md:grid-cols-2">
                <DanhSach tieuDe="Dữ kiện cần bổ sung" cacMuc={phanTich.missingFacts} />
                <DanhSach tieuDe="Bước nên làm tiếp" cacMuc={phanTich.nextSteps} />
              </div>

              {phanTich.citations.length > 0 ? (
                <div>
                  <p className="nhan-hoa mb-2">Căn cứ</p>
                  <div className="grid gap-1.5 md:grid-cols-2">
                    {phanTich.citations.map((c, i) => (
                      <ChipTrichDan
                        key={c.chunkId}
                        trichDan={c}
                        soThuTu={i + 1}
                        onChon={() =>
                          router.push(`/documents/${c.documentId}?node=${c.nodeId}`)
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="text-xs leading-relaxed text-nhan">{phanTich.disclaimer}</p>

              <div className="flex flex-wrap gap-2 print:hidden">
                <Nut
                  kieu="phu"
                  onClick={() =>
                    chay(async () => {
                      await guiJson("/api/cases", {
                        title: tinhHuong.slice(0, 90),
                        scenario: tinhHuong,
                        topic: chuDe || null,
                        analysis: phanTich,
                      });
                      setTin("Đã lưu hồ sơ vào không gian làm việc.");
                      await lamMoi();
                    })
                  }
                >
                  Lưu hồ sơ
                </Nut>
                <Nut kieu="vien" onClick={() => window.print()}>
                  In hoặc xuất PDF
                </Nut>
              </div>
            </div>
          ) : null}
        </The>

        <div className="grid gap-3 lg:grid-cols-2 print:hidden">
          {/* ---------- Theo dõi ---------- */}
          <The className="flex flex-col gap-4">
            <TieuDeMuc phu="Nhận cập nhật khi có tin hoặc văn bản mới thuộc chủ đề">
              Theo dõi thay đổi
            </TieuDeMuc>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
              <ONhap
                value={tenTheoDoi}
                onChange={(e) => setTenTheoDoi(e.target.value)}
                placeholder="Tên theo dõi"
                aria-label="Tên theo dõi"
              />
              <OChon
                value={chuDeTheoDoi}
                onChange={(e) => setChuDeTheoDoi(e.target.value as NewsTopic)}
                aria-label="Chủ đề theo dõi"
              >
                {CHU_DE.map((t) => (
                  <option key={t} value={t}>
                    {NHAN_CHU_DE_TIN[t]}
                  </option>
                ))}
              </OChon>
              <Nut
                onClick={() =>
                  chay(async () => {
                    await guiJson("/api/watchlists", {
                      name: tenTheoDoi || NHAN_CHU_DE_TIN[chuDeTheoDoi],
                      topics: [chuDeTheoDoi],
                      documentIds: [],
                    });
                    setTenTheoDoi("");
                    setTin("Đã tạo theo dõi mới.");
                    await lamMoi();
                  })
                }
              >
                Thêm
              </Nut>
            </div>

            {theoDoi.length > 0 ? (
              <div className="flex flex-col gap-2">
                {theoDoi.map((t) => (
                  <div key={t.id} className="rounded-[--bo] bg-khay p-3.5">
                    <p className="text-sm font-medium">
                      {t.name}
                      <span className="ml-2 font-normal text-nhan">
                        {t.alerts.length} cập nhật
                      </span>
                    </p>
                    {t.alerts.slice(0, 3).map((c) => (
                      <a
                        key={`${c.kind}-${c.id}`}
                        href={c.href}
                        className="mt-1.5 block line-clamp-1 text-xs text-nhan underline-offset-4 hover:text-but-xanh hover:underline"
                      >
                        {c.kind === "news" ? "Tin" : "Văn bản"}: {c.title}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-nhan">
                Chưa theo dõi chủ đề nào. Tạo một mục để nhận cập nhật.
              </p>
            )}
          </The>

          {/* ---------- Biểu mẫu ---------- */}
          <The className="flex flex-col gap-4">
            <TieuDeMuc phu="Bản nháp để bạn sửa lại, không phải văn bản nộp được ngay">
              Tạo đơn và biểu mẫu
            </TieuDeMuc>

            <Truong nhan="Loại đơn">
              {(id) => (
                <OChon id={id} value={maDon} onChange={(e) => setMaDon(e.target.value)}>
                  {MAU_DON.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nhan}
                    </option>
                  ))}
                </OChon>
              )}
            </Truong>

            <div className="grid gap-2 sm:grid-cols-2">
              <ONhap
                value={truong.fullName}
                onChange={(e) => setTruong({ ...truong, fullName: e.target.value })}
                placeholder="Họ và tên"
                aria-label="Họ và tên"
              />
              <ONhap
                value={truong.recipient}
                onChange={(e) => setTruong({ ...truong, recipient: e.target.value })}
                placeholder="Nơi nhận hoặc bên liên quan"
                aria-label="Nơi nhận"
              />
              <ONhap
                value={truong.address}
                onChange={(e) => setTruong({ ...truong, address: e.target.value })}
                placeholder="Địa chỉ"
                aria-label="Địa chỉ"
                className="sm:col-span-2"
              />
              <OVanBan
                rows={2}
                value={truong.facts}
                onChange={(e) => setTruong({ ...truong, facts: e.target.value })}
                placeholder="Sự việc, sản phẩm hoặc kỳ lương"
                aria-label="Sự việc"
                className="sm:col-span-2"
              />
              <OVanBan
                rows={2}
                value={truong.request}
                onChange={(e) => setTruong({ ...truong, request: e.target.value })}
                placeholder="Yêu cầu của bạn"
                aria-label="Yêu cầu"
                className="sm:col-span-2"
              />
            </div>

            <div className="flex justify-end">
              <Nut
                kieu="phu"
                onClick={() =>
                  chay(async () => {
                    const kq = await guiJson<{ text: string }>("/api/templates", {
                      templateId: maDon,
                      fields: {
                        ...truong,
                        seller: truong.recipient,
                        employer: truong.recipient,
                        product: truong.facts,
                        period: truong.facts,
                      },
                    });
                    setBanNhap(kq.text);
                  })
                }
              >
                Tạo bản nháp
              </Nut>
            </div>

            {banNhap ? (
              <OVanBan readOnly rows={12} value={banNhap} className="font-ma text-xs" />
            ) : null}
          </The>
        </div>

        {/* ---------- Hồ sơ đã lưu ---------- */}
        <The className="flex flex-col gap-4 print:hidden">
          <TieuDeMuc phu="Bấm để mở lại tình huống và kết quả phân tích">
            Hồ sơ đã lưu ({vuViec.length})
          </TieuDeMuc>
          {vuViec.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {vuViec.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setTinhHuong(v.scenario);
                    setChuDe(v.topic ?? "");
                    setPhanTich(v.analysis);
                  }}
                  className="rounded-[--bo] bg-khay p-3.5 text-left transition-colors duration-[--nhip] hover:bg-khay-sau"
                >
                  <span className="block line-clamp-1 text-sm font-medium">{v.title}</span>
                  <span className="mt-1 block text-xs text-nhan">
                    {new Date(v.updatedAt).toLocaleString("vi-VN")}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-nhan">
              Chưa lưu hồ sơ nào. Phân tích một tình huống rồi bấm Lưu hồ sơ.
            </p>
          )}
        </The>

        {/* ---------- Hồ sơ người dùng ---------- */}
        <The className="flex flex-col gap-4 print:hidden">
          <TieuDeMuc phu="Chỉ dùng để điền sẵn vào biểu mẫu, không gửi đi đâu">
            Hồ sơ người dùng
          </TieuDeMuc>
          {hoSo ? (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <ONhap
                value={hoSo.displayName}
                onChange={(e) => setHoSo({ ...hoSo, displayName: e.target.value })}
                placeholder="Tên hiển thị"
                aria-label="Tên hiển thị"
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
                    if (!r.ok) throw new Error("Không lưu được hồ sơ.");
                    setTin("Đã cập nhật hồ sơ người dùng.");
                  })
                }
              >
                Lưu hồ sơ
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

function DanhSach({ tieuDe, cacMuc }: { tieuDe: string; cacMuc: string[] }) {
  return (
    <div>
      <p className="nhan-hoa">{tieuDe}</p>
      {cacMuc.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1.5">
          {cacMuc.map((m) => (
            <li key={m} className="flex gap-2.5 text-sm leading-relaxed">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-nhan" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-nhan">Không có mục nào.</p>
      )}
    </div>
  );
}

async function layJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const d = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(d.error ?? "Không đọc được dữ liệu.");
  return d;
}
async function guiJson<T = unknown>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(d.error ?? "Không xử lý được yêu cầu.");
  return d;
}
const docLoi = (e: unknown) => (e instanceof Error ? e.message : "Có lỗi xảy ra.");
