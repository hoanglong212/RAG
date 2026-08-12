/**
 * Boc metadata tu phan dau van ban: so hieu, loai van ban, co quan ban hanh,
 * ngay ban hanh, ngay hieu luc, trich yeu.
 * Thieu truong nao thi tra null va day mot canh bao — khong doan bua.
 */
import { LOAI_VAN_BAN, MA_LOAI_VAN_BAN, P, P_CHAT } from "./patterns";
import { laDongQuocHieu, type DongVanBan } from "./structure";
import type { CanhBao, LoaiVanBan, MetadataVanBan } from "./types";

/** So dong toi da coi la "phan dau van ban" khi khong tim thay Dieu nao. */
const TOI_DA_DONG_PHAN_DAU = 60;

export function bocMetadata(dong: DongVanBan[]): {
  metadata: MetadataVanBan;
  canh_bao: CanhBao[];
} {
  const canhBao: CanhBao[] = [];
  const phanDau = catPhanDau(dong);
  const textPhanDau = phanDau.map((d) => d.text).join("\n");
  const textDayDu = dong.map((d) => d.text).join("\n");

  const so_hieu = docSoHieu(textPhanDau) ?? docSoHieu(textDayDu);
  const loai_van_ban_raw = docLoaiVanBanRaw(phanDau);
  const loai_van_ban = docLoaiVanBan(phanDau, so_hieu);
  const co_quan_ban_hanh = docCoQuanBanHanh(phanDau);
  const ngay_ban_hanh = docNgayBanHanh(textPhanDau);
  const ngay_hieu_luc = docNgayHieuLuc(textDayDu);
  const trich_yeu = docTrichYeu(phanDau, loai_van_ban);

  const metadata: MetadataVanBan = {
    so_hieu,
    loai_van_ban,
    loai_van_ban_raw,
    co_quan_ban_hanh,
    ngay_ban_hanh,
    ngay_hieu_luc,
    trich_yeu,
  };

  const metadataBatBuoc = {
    so_hieu,
    loai_van_ban,
    co_quan_ban_hanh,
    ngay_ban_hanh,
    ngay_hieu_luc,
    trich_yeu,
  };
  for (const [ten, gt] of Object.entries(metadataBatBuoc)) {
    if (gt === null) {
      canhBao.push({
        loai: "thieu_metadata",
        thong_diep: `Không bóc được trường "${ten}" từ phần đầu văn bản.`,
      });
    }
  }

  return { metadata, canh_bao: canhBao };
}

export function docLoaiVanBanRaw(phanDau: DongVanBan[]): string | null {
  const uuTien = [...LOAI_VAN_BAN].sort((a, b) => b.length - a.length);
  for (const dong of phanDau) {
    const lower = dong.text.toLocaleLowerCase("vi");
    for (const loai of uuTien) {
      const index = lower.indexOf(loai.toLocaleLowerCase("vi"));
      if (index !== -1) return dong.text.slice(index, index + loai.length);
    }
  }
  return null;
}

/** Phan dau = tu dau van ban toi tieu de Chuong/Dieu dau tien. */
function catPhanDau(dong: DongVanBan[]): DongVanBan[] {
  const het = dong.findIndex(
    (d) => P_CHAT.chuong.test(d.text) || P_CHAT.dieu.test(d.text),
  );
  return dong.slice(0, het === -1 ? Math.min(dong.length, TOI_DA_DONG_PHAN_DAU) : het);
}

export function docSoHieu(text: string): string | null {
  const m = P.soHieu.exec(text);
  if (m) return `${m[1]}/${m[2]}/${m[3]}`;
  const mqh = P_CHAT.soHieuQuocHoi.exec(text);
  if (mqh) return `${mqh[1]}/${mqh[2]}/${mqh[3]}`;
  return null;
}

export function docLoaiVanBan(
  phanDau: DongVanBan[],
  soHieu: string | null,
): LoaiVanBan | null {
  const text = phanDau.map((d) => d.text).join("\n").toLowerCase();
  // Uu tien cum dai hon: "Thong tu lien tich" phai thang "Thong tu".
  const theoTen = [...LOAI_VAN_BAN]
    .sort((a, b) => b.length - a.length)
    .find((loai) => text.includes(loai.toLowerCase()));
  if (theoTen) return theoTen;

  if (soHieu) {
    const ma = soHieu.split("/")[2]?.split("-")[0] ?? "";
    if (/^QH\d*$/.test(ma)) return "Luật";
    const theoMa = MA_LOAI_VAN_BAN[ma];
    if (theoMa) return theoMa;
  }
  return null;
}

/**
 * Co quan ban hanh nam o goc tren ben trai, viet HOA, ngay truoc so hieu.
 * Bo qua quoc hieu va dong ten loai van ban.
 */
export function docCoQuanBanHanh(phanDau: DongVanBan[]): string | null {
  const tenLoaiHoa = LOAI_VAN_BAN.map((l) => l.toUpperCase());
  for (const d of phanDau) {
    const t = d.text.trim();
    if (t === "" || laDongQuocHieu(t)) continue;
    if (!/\p{Lu}/u.test(t) || t !== t.toUpperCase()) continue;
    if (tenLoaiHoa.includes(t.replace(/[.:]$/, ""))) continue;
    if (P.soHieu.test(t) || P_CHAT.soHieuQuocHoi.test(t)) continue;
    if (t.length > 80) continue;
    return t;
  }
  return null;
}

export function docNgayBanHanh(text: string): string | null {
  const m = P.ngay.exec(text);
  return m ? sangISO(m[1], m[2], m[3]) : null;
}

export function docNgayHieuLuc(text: string): string | null {
  const m = P_CHAT.hieuLuc.exec(text);
  return m ? sangISO(m[1], m[2], m[3]) : null;
}

function sangISO(ngay: string, thang: string, nam: string): string | null {
  const d = Number(ngay);
  const t = Number(thang);
  const n = Number(nam);
  if (d < 1 || d > 31 || t < 1 || t > 12) return null;
  return `${n}-${String(t).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Trich yeu nam ngay duoi dong ten loai van ban viet HOA.
 * Vi du:  NGHỊ ĐỊNH
 *         Quy định chi tiết thi hành một số điều của Luật An toàn thực phẩm
 */
export function docTrichYeu(
  phanDau: DongVanBan[],
  loaiVanBan: LoaiVanBan | null,
): string | null {
  if (!loaiVanBan) return null;
  const nhan = loaiVanBan.toUpperCase();
  const viTri = phanDau.findIndex((d) => d.text.replace(/[.:]$/, "").trim() === nhan);
  if (viTri === -1) return null;

  const phan: string[] = [];
  for (let i = viTri + 1; i < phanDau.length; i += 1) {
    const t = phanDau[i].text.trim();
    if (t === "") {
      if (phan.length > 0) break;
      continue;
    }
    if (/^(Căn cứ|Theo đề nghị|Xét đề nghị|Chính phủ|Bộ trưởng|Thủ tướng)\b/i.test(t)) break;
    phan.push(t);
  }
  const trichYeu = phan.join(" ").trim();
  return trichYeu === "" ? null : trichYeu;
}
