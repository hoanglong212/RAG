import { extname } from "node:path";
import mammoth from "mammoth";

export const SUPPORTED_DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"] as const;

export function isSupportedDocumentName(fileName: string): boolean {
  const extension = extname(fileName).toLowerCase();
  return SUPPORTED_DOCUMENT_EXTENSIONS.some((supported) => supported === extension);
}

export interface SourceDocument {
  fileName: string;
  data: Uint8Array;
}

export interface ExtractedDocument {
  text: string;
  warnings: string[];
}

export class UnsupportedDocumentError extends Error {
  constructor(extension: string) {
    super(
      `Định dạng "${extension || "không xác định"}" không được hỗ trợ. Chỉ nhận ${SUPPORTED_DOCUMENT_EXTENSIONS.join(", ")}.`,
    );
    this.name = "UnsupportedDocumentError";
  }
}

/**
 * Thông báo nói rõ ĐÃ ĐO ĐƯỢC GÌ, không chỉ nói "không có text layer".
 *
 * Người dùng nhìn thấy một PDF mở lên đọc được bằng mắt và bị từ chối thì
 * sẽ tưởng hệ thống hỏng. Nói ra số trang đã quét và bao nhiêu trang có chữ
 * biến câu từ chối thành một kết luận kiểm chứng được, kèm đúng việc cần làm
 * tiếp.
 */
export class PdfWithoutTextLayerError extends Error {
  constructor(
    readonly soTrang = 0,
    readonly soTrangCoChu = 0,
  ) {
    super(
      soTrang > 0
        ? `Đã quét ${soTrang} trang, không trang nào chứa chữ đọc được bằng máy — đây là bản scan (ảnh chụp trang giấy). Hệ thống không làm OCR. Hãy tải bản có lớp chữ từ nguồn chính thức, hoặc nạp bản DOCX.`
        : "PDF không có text layer; OCR nằm ngoài phạm vi của hệ thống.",
    );
    this.name = "PdfWithoutTextLayerError";
  }
}

export async function extractDocument(source: SourceDocument): Promise<ExtractedDocument> {
  const extension = extname(source.fileName).toLowerCase();
  switch (extension) {
    case ".txt":
    case ".md":
      return { text: decodeUtf8(source.data), warnings: [] };
    case ".docx":
      return extractDocx(source.data);
    case ".pdf":
      return extractPdf(source.data);
    default:
      throw new UnsupportedDocumentError(extension);
  }
}

function decodeUtf8(data: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(data).replace(/^\uFEFF/, "");
  } catch {
    throw new Error("Tệp văn bản không dùng mã hóa UTF-8 hợp lệ.");
  }
}

async function extractDocx(data: Uint8Array): Promise<ExtractedDocument> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(data) });
  const text = result.value.trim();
  if (!text) throw new Error("DOCX không chứa văn bản có thể trích xuất.");
  return {
    text,
    warnings: result.messages.map((message) => message.message),
  };
}

async function extractPdf(data: Uint8Array): Promise<ExtractedDocument> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = getDocument({
    data: new Uint8Array(data),
    useWorkerFetch: false,
    useSystemFonts: true,
  });
  const document = await loadingTask.promise;

  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines: string[] = [];
      let currentLine = "";

      for (const item of content.items) {
        if (!("str" in item)) continue;
        const value = item.str.trim();
        if (value) currentLine = currentLine ? `${currentLine} ${value}` : value;
        if (item.hasEOL && currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
      }
      if (currentLine) lines.push(currentLine);
      pages.push(lines.join("\n"));
    }

    assertPdfHasText(pages);
    return { text: pages.join("\f"), warnings: [] };
  } finally {
    await loadingTask.destroy();
  }
}

export function assertPdfHasText(pages: string[]): void {
  const coChu = pages.filter((page) => page.trim().length > 0).length;
  if (coChu === 0) {
    throw new PdfWithoutTextLayerError(pages.length, coChu);
  }
}
