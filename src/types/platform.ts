import type { Citation, TrangThaiHieuLuc } from "./contract";
import type { LegalCheckStatus, NewsTopic } from "./news";

export interface UserProfileView {
  id: string;
  displayName: string;
  email: string | null;
}

export interface CaseAnalysis {
  status: LegalCheckStatus;
  answer: string | null;
  citations: Citation[];
  topScore: number;
  detectedTopics: NewsTopic[];
  missingFacts: string[];
  nextSteps: string[];
  disclaimer: string;
}

export interface LegalCaseView {
  id: string;
  title: string;
  scenario: string;
  topic: NewsTopic | null;
  status: string;
  analysis: CaseAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoverageRow {
  topic: NewsTopic;
  documents: number;
  chunks: number;
  enabledDocuments: number;
  verifiedDocuments: number;
  warningDocuments: number;
  lastVerifiedAt: string | null;
}

export interface TimelineDocument {
  id: string;
  soHieu: string | null;
  trichYeu: string | null;
  ngayBanHanh: string | null;
  ngayHieuLuc: string | null;
  trangThai: TrangThaiHieuLuc;
  validityNote: string | null;
  sourceUrl: string | null;
  activeAt: boolean;
}

export interface TimelineRelation {
  id: string;
  direction: "incoming" | "outgoing";
  type: string;
  effectiveFrom: string | null;
  note: string | null;
  document: Pick<TimelineDocument, "id" | "soHieu" | "trichYeu">;
  sourceUrl: string;
}

export interface CompareChange {
  key: string;
  kind: "added" | "removed" | "changed";
  breadcrumb: string;
  left: string | null;
  right: string | null;
}

export interface PenaltyResult {
  ruleId: string;
  label: string;
  topic: NewsTopic;
  source: { soHieu: string; dieu: number; khoan?: number; diem?: string };
  amountFrom: number | null;
  amountTo: number | null;
  evidence: Citation | null;
}

export interface WatchlistView {
  id: string;
  name: string;
  topics: NewsTopic[];
  documentIds: string[];
  lastSeenAt: string;
  alerts: Array<{
    id: string;
    kind: "document" | "news";
    title: string;
    at: string;
    href: string;
  }>;
}
