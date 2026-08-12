import { basename } from "node:path";
import {
  assertValidEmbeddings,
  EMBEDDING_BATCH_SIZE,
  type EmbeddingProvider,
} from "../embedding/provider";
import {
  parseVanBan,
  type CanhBao,
  type ChunkParse,
  type DocNodeParse,
  type MetadataVanBan,
} from "../parser";
import { extractDocument, type ExtractedDocument, type SourceDocument } from "./extract";
import { createFixedChunks } from "./fixed";

export interface PersistedChunk extends ChunkParse {
  strategy: "structural" | "fixed";
  embedding: number[];
}

export interface CompleteDocumentInput {
  metadata: MetadataVanBan;
  pageCount: number;
  nodes: DocNodeParse[];
  chunks: PersistedChunk[];
  parseWarnings: CanhBao[];
}

export interface IngestStorage {
  createPending(fileName: string): Promise<string>;
  complete(documentId: string, input: CompleteDocumentInput): Promise<void>;
  fail(documentId: string, detail: string): Promise<void>;
}

export interface IngestDependencies {
  storage: IngestStorage;
  embeddingProvider: EmbeddingProvider;
  extract?: (source: SourceDocument) => Promise<ExtractedDocument>;
}

export interface IngestResult {
  documentId: string;
  warnings: CanhBao[];
  extractionWarnings: string[];
  chunkCount: number;
}

export class IngestDocumentError extends Error {
  constructor(
    readonly documentId: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "IngestDocumentError";
  }
}

export async function ingestDocument(
  source: SourceDocument,
  dependencies: IngestDependencies,
): Promise<IngestResult> {
  const safeName = basename(source.fileName);
  const documentId = await dependencies.storage.createPending(safeName);

  try {
    const extracted = await (dependencies.extract ?? extractDocument)({
      fileName: safeName,
      data: source.data,
    });
    const parsed = parseVanBan(extracted.text, { tenFile: safeName });
    const documentLabel = parsed.metadata.so_hieu ?? safeName;
    const fixedChunks = createFixedChunks(extracted.text, documentLabel);
    const chunks = [
      ...parsed.chunks.map((chunk) => ({ ...chunk, strategy: "structural" as const })),
      ...fixedChunks.map((chunk) => ({
        ...chunk,
        strategy: "fixed" as const,
      })),
    ];
    if (chunks.length === 0) {
      throw new Error("Không tạo được chunk nào từ văn bản rỗng.");
    }
    const embeddings: number[][] = [];
    for (let offset = 0; offset < chunks.length; offset += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(offset, offset + EMBEDDING_BATCH_SIZE);
      const vectors = await dependencies.embeddingProvider.embed(
        batch.map((chunk) => chunk.noi_dung_kem_ngu_canh),
      );
      assertValidEmbeddings(
        vectors,
        batch.length,
        dependencies.embeddingProvider.dimensions,
      );
      embeddings.push(...vectors);
    }

    const persistedChunks = chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }));
    await dependencies.storage.complete(documentId, {
      metadata: parsed.metadata,
      pageCount: parsed.so_trang,
      nodes: parsed.nodes,
      chunks: persistedChunks,
      parseWarnings: parsed.canh_bao,
    });

    return {
      documentId,
      warnings: parsed.canh_bao,
      extractionWarnings: extracted.warnings,
      chunkCount: persistedChunks.length,
    };
  } catch (cause) {
    const detail = safeErrorMessage(cause);
    try {
      await dependencies.storage.fail(documentId, detail);
    } catch (markFailure) {
      throw new IngestDocumentError(
        documentId,
        `${detail} Đồng thời không ghi được trạng thái lỗi: ${safeErrorMessage(markFailure)}`,
        { cause },
      );
    }
    throw new IngestDocumentError(documentId, detail, { cause });
  }
}

export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Lỗi không xác định.";
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[DATABASE_URL]").slice(0, 2_000);
}
