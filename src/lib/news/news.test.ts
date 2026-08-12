import { describe, expect, it } from "vitest";
import { classifyNews } from "./classifier";
import { canonicalizeUrl, parseNewsFeed } from "./rss";

describe("news classifier", () => {
  it("phân loại đa chủ đề thay vì chỉ sức khỏe", () => {
    expect(classifyNews("Công ty nợ tiền lương người lao động").topics).toContain("lao_dong");
    expect(classifyNews("Quy hoạch đất đai và dự án nhà ở").topics).toContain("dat_dai_nha_o");
    expect(classifyNews("Khởi tố vụ vi phạm an toàn thực phẩm").topics).toEqual(
      expect.arrayContaining(["phap_luat", "an_toan_thuc_pham"]),
    );
    expect(classifyNews("Tại Hà Nội có một sự kiện mới").topics).not.toContain("cong_nghe");
  });
});

describe("RSS parser", () => {
  it("đọc RSS, bỏ HTML và tham số theo dõi", () => {
    const items = parseNewsFeed(`<?xml version="1.0"?><rss><channel><item>
      <title>Tin pháp luật</title>
      <link>https://example.com/bai-viet?utm_source=rss&amp;id=1</link>
      <description><![CDATA[<img src="https://example.com/a.jpg"><b>Khởi tố</b> vụ vi phạm]]></description>
      <pubDate>Wed, 12 Aug 2026 08:00:00 +0700</pubDate>
    </item></channel></rss>`);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Tin pháp luật",
      summary: "Khởi tố vụ vi phạm",
      url: "https://example.com/bai-viet?id=1",
      imageUrl: "https://example.com/a.jpg",
      topics: expect.arrayContaining(["phap_luat"]),
    });
  });

  it("chỉ chấp nhận URL HTTP(S)", () => {
    expect(canonicalizeUrl("javascript:alert(1)")).toBe("");
  });
});
