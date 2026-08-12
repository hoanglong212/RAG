import { describe, expect, it } from "vitest";
import {
  assertPdfHasText,
  extractDocument,
  isSupportedDocumentName,
  PdfWithoutTextLayerError,
  UnsupportedDocumentError,
} from "./extract";

describe("extractDocument", () => {
  it("doc TXT UTF-8 va bo BOM", async () => {
    const data = new TextEncoder().encode("\uFEFFĐiều 1. Phạm vi áp dụng");
    await expect(extractDocument({ fileName: "luat.txt", data })).resolves.toEqual({
      text: "Điều 1. Phạm vi áp dụng",
      warnings: [],
    });
  });

  it("tu choi dinh dang ngoai pham vi", async () => {
    expect(isSupportedDocumentName("van-ban.PDF")).toBe(true);
    expect(isSupportedDocumentName("anh.png")).toBe(false);
    await expect(
      extractDocument({ fileName: "anh.png", data: new Uint8Array() }),
    ).rejects.toBeInstanceOf(UnsupportedDocumentError);
  });

  it("nhan dien PDF khong co text layer", () => {
    expect(() => assertPdfHasText(["", "   "])).toThrow(PdfWithoutTextLayerError);
    expect(() => assertPdfHasText(["", "Điều 1"])).not.toThrow();
  });
});
