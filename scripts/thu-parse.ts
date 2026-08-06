/**
 * Cong cu doi chieu bang mat: chay parser len mot file van ban va in ra cay cau truc.
 *
 *   npx tsx scripts/thu-parse.ts <duong-dan-file.txt> [--chunk]
 *
 * Hien chi doc file text thuan (.txt/.md). Doc PDF/DOCX la viec cua Phase 3;
 * khi co ham extract o do thi noi vao day.
 */
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { parseVanBan } from "../src/lib/parser/index";
import { chuanHoaVanBan, demSoTrang, tachCauTruc, uocLuongSoToken } from "../src/lib/parser/structure";

const DINH_DANG_HO_TRO = [".txt", ".md"];

function main(): void {
  const [duongDan, ...co] = process.argv.slice(2);
  if (!duongDan) {
    console.error("Thiếu đường dẫn file. Ví dụ: npx tsx scripts/thu-parse.ts data/raw/nd-15.txt");
    process.exit(1);
  }
  const duoi = extname(duongDan).toLowerCase();
  if (!DINH_DANG_HO_TRO.includes(duoi)) {
    console.error(
      `Chưa hỗ trợ định dạng "${duoi}". Hiện chỉ đọc ${DINH_DANG_HO_TRO.join(", ")} — ` +
        "đọc PDF/DOCX sẽ có ở Phase 3.",
    );
    process.exit(1);
  }

  const raw = readFileSync(duongDan, "utf8");
  const tenFile = basename(duongDan);
  const kq = parseVanBan(raw, { tenFile });
  const cauTruc = tachCauTruc(chuanHoaVanBan(raw), demSoTrang(raw));

  console.log("=== METADATA ===");
  for (const [k, v] of Object.entries(kq.metadata)) {
    console.log(`  ${k.padEnd(18)} ${v ?? "(không bóc được)"}`);
  }

  console.log("\n=== CÂY CẤU TRÚC ===");
  let chuongTruoc: string | null = null;
  let mucTruoc: string | null = null;
  for (const d of cauTruc.dieu) {
    if (d.chuong !== chuongTruoc) {
      chuongTruoc = d.chuong;
      mucTruoc = null;
      if (d.chuong) console.log(`${d.chuong}${d.chuong_tieu_de ? ` — ${d.chuong_tieu_de}` : ""}`);
    }
    if (d.muc !== mucTruoc) {
      mucTruoc = d.muc;
      if (d.muc) console.log(`  ${d.muc}${d.muc_tieu_de ? ` — ${d.muc_tieu_de}` : ""}`);
    }
    console.log(`    Điều ${d.so}${d.tieu_de ? `. ${d.tieu_de}` : ""}  [trang ${d.trang}]`);
    if (d.khoan.length === 0) {
      console.log(`      (không có Khoản — ${uocLuongSoToken(d.mo_dau.map((x) => x.text).join(" "))} token)`);
    }
    for (const k of d.khoan) {
      const soToken = uocLuongSoToken(
        [...k.dong, ...k.diem.flatMap((x) => x.dong)].map((x) => x.text).join(" "),
      );
      console.log(`      Khoản ${k.so}  (${soToken} token${k.diem.length ? `, ${k.diem.length} điểm` : ""})`);
      for (const dm of k.diem) console.log(`        Điểm ${dm.ky_hieu})`);
    }
  }

  for (const pl of cauTruc.phu_luc) {
    console.log(`${pl.ten}  [${pl.dong.length} dòng]`);
  }

  console.log("\n=== TỔNG KẾT ===");
  console.log(`  số trang        ${kq.so_trang}`);
  console.log(`  số Điều         ${cauTruc.dieu.length}`);
  console.log(`  số chunk        ${kq.chunks.length}`);
  console.log(`  chunk bị cắt    ${kq.chunks.filter((c) => c.bi_cat_cung).length}`);
  console.log(`  token trung bình ${trungBinh(kq.chunks.map((c) => c.so_token))}`);

  console.log(`\n=== CẢNH BÁO (${kq.canh_bao.length}) ===`);
  for (const c of kq.canh_bao) {
    console.log(`  [${c.loai}] ${c.thong_diep}${c.dong !== undefined ? ` (dòng ${c.dong})` : ""}`);
  }

  if (co.includes("--chunk")) {
    console.log("\n=== CHUNK ===");
    for (const c of kq.chunks) {
      console.log(`\n--- ${c.duong_dan}  [${c.so_token} token, trang ${c.vi_tri_trang}]`);
      console.log(c.noi_dung_kem_ngu_canh);
    }
  }
}

function trungBinh(xs: number[]): number {
  return xs.length === 0 ? 0 : Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

main();
