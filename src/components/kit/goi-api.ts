/**
 * Gọi API và đọc phản hồi AN TOÀN.
 *
 * Vì sao cần: khắp các trang đang viết `const d = await r.json()` rồi mới
 * kiểm `r.ok`. Khi máy chủ trả về một trang lỗi HTML — 404, 500, hay trang
 * lỗi của Next lúc dev — thì `r.json()` ném ra trước, và người dùng nhận
 * đúng dòng chữ này:
 *
 *     Unexpected token '<', "<!DOCTYPE "... is not valid JSON
 *
 * Đó là thông báo dành cho lập trình viên, lọt thẳng ra giao diện, và nó
 * giấu mất chuyện thật sự đã xảy ra. Ở đây kiểm content-type trước, rồi mới
 * đọc, và luôn dựng được một câu tiếng Việt nói đúng cái gì hỏng.
 */

/** Lỗi mang theo mã HTTP để nơi gọi quyết định hiển thị thế nào. */
export class LoiGoiApi extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LoiGoiApi";
  }
}

function moTaTheoMa(status: number, duongDan: string): string {
  if (status === 404) {
    return `Không tìm thấy đường dẫn ${duongDan} trên máy chủ. Nếu bạn đang chạy nhiều tiến trình "next dev" cùng lúc, hãy tắt bớt chỉ còn một rồi thử lại.`;
  }
  if (status === 400) return "Máy chủ từ chối yêu cầu vì dữ liệu gửi lên không hợp lệ.";
  if (status === 401 || status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (status === 429) return "Máy chủ đang giới hạn số lượt. Hãy thử lại sau ít phút.";
  if (status >= 500) return "Máy chủ gặp lỗi khi xử lý yêu cầu.";
  return `Máy chủ trả về mã ${status}.`;
}

/**
 * Đọc phản hồi thành JSON, hoặc ném LoiGoiApi với thông báo đọc được.
 * Phản hồi lỗi CÓ kèm JSON `{ error }` thì lấy đúng câu đó — nó cụ thể hơn
 * mọi câu mặc định ở đây.
 */
export async function docPhanHoi<T>(response: Response, duongDan: string): Promise<T> {
  const loaiNoiDung = response.headers.get("content-type") ?? "";
  const laJson = loaiNoiDung.includes("application/json");

  if (!laJson) {
    // Nuốt thân phản hồi để không rò kết nối, nhưng không cố parse nó.
    await response.text().catch(() => "");
    throw new LoiGoiApi(moTaTheoMa(response.status, duongDan), response.status);
  }

  const dl = (await response.json().catch(() => null)) as (T & { error?: string }) | null;

  if (!response.ok) {
    throw new LoiGoiApi(
      dl?.error ?? moTaTheoMa(response.status, duongDan),
      response.status,
    );
  }
  if (dl === null) {
    throw new LoiGoiApi("Máy chủ trả về dữ liệu rỗng.", response.status);
  }
  return dl;
}

/** GET + đọc an toàn. */
export async function layJson<T>(duongDan: string): Promise<T> {
  const r = await fetch(duongDan).catch(() => {
    throw new LoiGoiApi("Không kết nối được tới máy chủ.", 0);
  });
  return docPhanHoi<T>(r, duongDan);
}

/** POST JSON + đọc an toàn. */
export async function guiJson<T>(duongDan: string, body: unknown): Promise<T> {
  const r = await fetch(duongDan, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    throw new LoiGoiApi("Không kết nối được tới máy chủ.", 0);
  });
  return docPhanHoi<T>(r, duongDan);
}

export function docLoi(e: unknown): string {
  if (e instanceof LoiGoiApi) return e.message;
  if (e instanceof Error) return e.message;
  return "Có lỗi xảy ra.";
}
