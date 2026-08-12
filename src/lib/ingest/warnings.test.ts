import { describe, expect, it } from "vitest";
import { toContractWarnings } from "./warnings";

describe("toContractWarnings", () => {
  it("chi dua ma canh bao da dong bang trong contract ra API", () => {
    expect(
      toContractWarnings([
        {
          loai: "thieu_metadata",
          thong_diep: 'Không bóc được trường "so_hieu" từ phần đầu văn bản.',
        },
        {
          loai: "thieu_metadata",
          thong_diep: 'Không bóc được trường "loai_van_ban" từ phần đầu văn bản.',
        },
        {
          loai: "chunk_bi_cat_cung",
          thong_diep: "Chunk dài phải cắt theo câu.",
        },
      ]),
    ).toEqual([
      {
        code: "THIEU_SO_HIEU",
        message: 'Không bóc được trường "so_hieu" từ phần đầu văn bản.',
      },
      {
        code: "KHONG_XAC_DINH_LOAI",
        message: 'Không bóc được trường "loai_van_ban" từ phần đầu văn bản.',
      },
    ]);
  });
});
