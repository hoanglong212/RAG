import { describe, expect, it, vi } from "vitest";
import { HostedEmbeddingProvider } from "./hosted";

describe("HostedEmbeddingProvider", () => {
  it("sap xep vector theo index va kiem tra so chieu", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            { index: 1, embedding: [3, 4] },
            { index: 0, embedding: [1, 2] },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const provider = new HostedEmbeddingProvider(
      { apiKey: "test-key", apiUrl: "https://example.test/embeddings", model: "test", dimensions: 2 },
      fetchMock,
    );

    await expect(provider.embed(["một", "hai"])).resolves.toEqual([
      [1, 2],
      [3, 4],
    ]);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-key" });
  });

  it("tu choi vector sai so chieu", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ index: 0, embedding: [1] }] }), { status: 200 }),
    );
    const provider = new HostedEmbeddingProvider(
      { apiKey: "test-key", apiUrl: "https://example.test", model: "test", dimensions: 2 },
      fetchMock,
    );

    await expect(provider.embed(["văn bản"])).rejects.toThrow("có 1 chiều");
  });

  it("giu thong diep loi ngan gon tu dich vu", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "model không tồn tại" } }), { status: 400 }),
    );
    const provider = new HostedEmbeddingProvider(
      { apiKey: "test-key", apiUrl: "https://example.test", model: "test", dimensions: 2 },
      fetchMock,
    );

    await expect(provider.embed(["văn bản"])).rejects.toThrow("model không tồn tại");
  });
});
