import { getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { chunks, doc_nodes, documents, lan_chay_eval } from "./schema";

describe("D1 schema", () => {
  it("tach trang thai ingest khoi hieu luc va luu parse warnings", () => {
    const columns = getTableColumns(documents);
    expect(columns).toHaveProperty("trang_thai");
    expect(columns).toHaveProperty("ingest_status");
    expect(columns).toHaveProperty("parse_warnings");
    expect(columns).toHaveProperty("loai_van_ban_raw");
  });

  it("co doc_nodes va lien ket strategy/node_id tren chunks", () => {
    expect(getTableColumns(doc_nodes)).toMatchObject({
      document_id: expect.anything(),
      parent_id: expect.anything(),
      node_type: expect.anything(),
      order_index: expect.anything(),
      depth: expect.anything(),
    });
    expect(getTableColumns(chunks)).toMatchObject({
      node_id: expect.anything(),
      strategy: expect.anything(),
    });
    expect(getTableConfig(chunks).checks.map((item) => item.name)).toContain(
      "chunk_structural_has_node",
    );
  });

  it("bo sung cac truc so sanh cho lan_chay_eval hien co", () => {
    expect(getTableColumns(lan_chay_eval)).toMatchObject({
      recall_at_5: expect.anything(),
      recall_at_10: expect.anything(),
      embedder_name: expect.anything(),
      strategy: expect.anything(),
    });
  });
});
