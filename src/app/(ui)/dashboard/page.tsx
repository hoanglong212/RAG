/**
 * Đo lường — Khu A (kho văn bản) và Khu B (chất lượng hệ thống).
 *
 * Biểu đồ dựng ở ngày 10–11 theo lịch track B. Trang này hiện chỉ có phần
 * số tổng, đọc từ mock, để khung điều hướng không dẫn tới trang chết.
 */

import { mockStats } from "@/mocks/stats";
import { mockEvalRuns } from "@/mocks/evalRuns";

function O({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="rounded-[--bo-lon] bg-giay px-4 py-3.5">
      <p className="nhan-hoa">{nhan}</p>
      <p className="so-hieu mt-1.5 text-xl text-muc-in">{giaTri}</p>
    </div>
  );
}

export default function TrangDoLuong() {
  const lanChayMoiNhat = mockEvalRuns[mockEvalRuns.length - 1];
  const phanTram = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-lg font-semibold">Đo lường</h1>

        <section className="mt-5">
          <h2 className="nhan-hoa">Khu A — Kho văn bản</h2>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <O nhan="Văn bản" giaTri={String(mockStats.tongVanBan)} />
            <O nhan="Chunk" giaTri={String(mockStats.tongChunk)} />
            <O nhan="Bóc tách sạch" giaTri={phanTram(mockStats.tyLeParseSach)} />
            <O nhan="Cơ quan" giaTri={String(mockStats.theoCoQuan.length)} />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="nhan-hoa">Khu B — Chất lượng hệ thống</h2>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <O nhan="Độ trễ P50" giaTri={`${mockStats.latencyP50} ms`} />
            <O nhan="Độ trễ P95" giaTri={`${mockStats.latencyP95} ms`} />
            <O nhan="Có trích dẫn" giaTri={phanTram(mockStats.tyLeCoTrichDan)} />
            <O
              nhan={`Recall@5 · ${lanChayMoiNhat.configName}`}
              giaTri={phanTram(lanChayMoiNhat.recallAt5)}
            />
          </div>

          <h3 className="nhan-hoa mt-5">Câu hỏi có điểm truy hồi thấp nhất</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {mockStats.cauHoiDiemThap.map((c) => (
              <li
                key={c.question}
                className="flex items-start gap-3 rounded-[--bo] bg-giay px-3.5 py-2.5 text-sm"
              >
                <span className="so-hieu shrink-0 text-nhan">
                  {c.topScore.toFixed(2).replace(".", ",")}
                </span>
                <span className="leading-snug">{c.question}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-6 text-sm text-nhan">
          Biểu đồ theo loại, theo cơ quan, theo năm và biểu đồ so sánh các lần chạy
          eval sẽ dựng ở ngày 10–11.
        </p>
      </div>
    </div>
  );
}
