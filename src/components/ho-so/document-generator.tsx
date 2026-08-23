"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Nut, The, TieuDeMuc } from "@/components/kit/co-ban";
import { OChon, ONhap, OVanBan } from "@/components/kit/truong";
import { docLoi, guiJson } from "@/components/kit/goi-api";
import type { LegalCaseView } from "@/types/platform";

const MAU_DON = [
  { id: "complaint", nhan: "Đơn khiếu nại" },
  { id: "warranty", nhan: "Yêu cầu bảo hành" },
  { id: "salary", nhan: "Yêu cầu thanh toán lương" },
] as const;

export function DocumentGenerator({
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
    <The className="flex flex-col gap-4 print:hidden sang-khi-cham">
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
        <div className="flex flex-col gap-2 hien-len">
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
