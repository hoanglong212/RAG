import { describe, expect, it, vi } from "vitest";
import { LocalEmbeddingProvider } from "./local";

describe("LocalEmbeddingProvider", () => {
  it("goi service local va kiem tra so chieu", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ embeddings: [[0.1, 0.2]] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const provider = new LocalEmbeddingProvider("http://127.0.0.1:8000", 2, "test", fetchMock);

    await expect(provider.embed(["an toàn thực phẩm"])).resolves.toEqual([[0.1, 0.2]]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
