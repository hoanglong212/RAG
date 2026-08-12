/** Kiểu riêng của chế độ Nghiên cứu sâu; không thay đổi contract RAG đã đóng băng. */

export type ResearchSourceKind = "corpus" | "official_web" | "reference_web";

export interface ResearchSource {
  id: string;
  kind: ResearchSourceKind;
  title: string;
  excerpt: string;
  score: number;
  domain?: string;
  url?: string;
  documentId?: string;
  chunkId?: string;
  nodeId?: string;
  soHieu?: string;
  breadcrumb?: string;
}

export type ResearchStage = "corpus" | "web" | "cross_check" | "synthesis";

export interface ResearchProgress {
  stage: ResearchStage;
  label: string;
}

