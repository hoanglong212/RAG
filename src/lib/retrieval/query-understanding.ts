import type { RetrievalResult } from "./vector";

export type AmendmentOperation = "add" | "amend" | "repeal" | "replace" | "delta";
export type LegalQueryIntent = "amendment_delta" | "current_provision" | "general";

export interface LegalLocator {
  dieu: number | null;
  khoan: number | null;
  diem: string | null;
}

export interface LegalQueryUnderstanding {
  intent: LegalQueryIntent;
  operation: AmendmentOperation | null;
  identifiers: string[];
  amendingIdentifier: string | null;
  targetIdentifier: string | null;
  locator: LegalLocator;
}

const IDENTIFIER_PATTERN = /\b\d{1,4}\/\d{4}\/[A-ZĐ0-9]+(?:-[A-ZĐ0-9]+)*\b/giu;

/** Normalize only for matching; source text remains unchanged for citations. */
export function normalizeForLegalMatching(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function extractLegalIdentifiers(question: string): string[] {
  return [...question.normalize("NFC").matchAll(IDENTIFIER_PATTERN)].map((match) => match[0]);
}

export function extractLegalIdentifier(question: string): string | null {
  return extractLegalIdentifiers(question)[0] ?? null;
}

export function extractLegalLocator(question: string): LegalLocator {
  const plain = normalizeForLegalMatching(question);
  return {
    dieu: readNumber(plain, /\bdieu\s+(\d+)\b/),
    khoan: readNumber(plain, /\bkhoan\s+(\d+)\b/),
    diem: plain.match(/\bdiem\s+([a-z])\b/)?.[1] ?? null,
  };
}

export function understandLegalQuery(question: string): LegalQueryUnderstanding {
  const normalized = normalizeForLegalMatching(question);
  const identifiers = extractLegalIdentifiers(question);
  const currentProvision =
    /\b(hien nay|hien hanh|toan bo|day du)\b/.test(normalized) ||
    /sau khi[^?]*(?:sua doi|bo sung)[^?]*(?:gom|noi dung|quy dinh)/.test(normalized) ||
    (!/\b(bo sung|sua doi|bai bo|bo bai|thay the|thay doi gi)\b/.test(normalized) &&
      /\b(quy dinh|noi dung|gom)\b/.test(normalized) &&
      /\b(dieu|khoan|diem)\s+[a-z0-9]+\b/.test(normalized));
  const operation = detectOperation(normalized);
  const intent: LegalQueryIntent = currentProvision
    ? "current_provision"
    : operation !== null
      ? "amendment_delta"
      : "general";

  let amendingIdentifier: string | null = null;
  let targetIdentifier: string | null = null;
  if (intent === "amendment_delta" && identifiers.length >= 2) {
    amendingIdentifier = identifiers[0] ?? null;
    targetIdentifier = identifiers.at(-1) ?? null;
  } else if (intent === "amendment_delta" && identifiers.length === 1) {
    const identifier = identifiers[0] ?? null;
    const identifierIndex = identifier === null
      ? -1
      : normalized.indexOf(normalizeForLegalMatching(identifier));
    const operationIndex = firstOperationIndex(normalized);
    if (identifierIndex > operationIndex && operationIndex >= 0) targetIdentifier = identifier;
    else amendingIdentifier = identifier;
  }

  return {
    intent,
    operation,
    identifiers,
    amendingIdentifier,
    targetIdentifier,
    locator: extractLegalLocator(question),
  };
}

/** Rerank amendment passages without mutating the retrieval confidence score. */
export function rerankForLegalIntent(
  question: string,
  results: RetrievalResult[],
): RetrievalResult[] {
  const understanding = understandLegalQuery(question);
  if (understanding.intent !== "amendment_delta") return [...results];

  return results
    .map((result, originalIndex) => ({
      result,
      originalIndex,
      intentScore: amendmentIntentScore(result, understanding),
    }))
    .sort(
      (left, right) =>
        right.intentScore - left.intentScore || left.originalIndex - right.originalIndex,
    )
    .map(({ result }) => result);
}

function amendmentIntentScore(
  result: RetrievalResult,
  understanding: LegalQueryUnderstanding,
): number {
  const content = normalizeForLegalMatching(result.content);
  const resultIdentifier = normalizeForLegalMatching(result.soHieu ?? "");
  let score = 0;

  if (containsOperation(content, understanding.operation)) score += 6;
  if (containsLocator(content, understanding.locator)) score += 6;
  if (
    understanding.amendingIdentifier !== null &&
    resultIdentifier === normalizeForLegalMatching(understanding.amendingIdentifier)
  ) score += 5;
  if (
    understanding.targetIdentifier !== null &&
    resultIdentifier === normalizeForLegalMatching(understanding.targetIdentifier)
  ) score -= 4;
  return score;
}

function detectOperation(normalized: string): AmendmentOperation | null {
  if (/\bthay the\b|\bthay cum tu\b/.test(normalized)) return "replace";
  if (/\b(bai bo|bo bai)\b/.test(normalized)) return "repeal";
  if (/\bsua doi\s*,?\s*bo sung\b/.test(normalized)) return "delta";
  if (/\bbo sung\b|\bthem\b/.test(normalized)) return "add";
  if (/\bsua doi\b/.test(normalized)) return "amend";
  if (/\b(diem moi|quy dinh moi|thay doi gi)\b/.test(normalized)) return "delta";
  return null;
}

function firstOperationIndex(normalized: string): number {
  const indexes = ["thay the", "bai bo", "bo bai", "bo sung", "them", "sua doi", "diem moi"]
    .map((value) => normalized.indexOf(value))
    .filter((value) => value >= 0);
  return indexes.length === 0 ? -1 : Math.min(...indexes);
}

function containsOperation(content: string, operation: AmendmentOperation | null): boolean {
  if (operation === "add") {
    // "sửa đổi, bổ sung" là thao tác AMEND; không được coi mọi đoạn đó là ADD.
    const withoutCompoundAmendment = content.replace(/\bsua doi\s*,?\s*bo sung\b/g, "");
    return /\bbo sung\b|\bthem\b/.test(withoutCompoundAmendment);
  }
  if (operation === "amend") return /\bsua doi\b/.test(content);
  if (operation === "repeal") return /\b(bai bo|bo bai)\b/.test(content);
  if (operation === "replace") return /\bthay the\b|\bthay cum tu\b/.test(content);
  return /\b(bo sung|sua doi|bai bo|bo bai|thay the)\b/.test(content);
}

function containsLocator(content: string, locator: LegalLocator): boolean {
  const requested = [locator.dieu, locator.khoan, locator.diem];
  if (requested.every((value) => value === null)) return false;
  return (
    (locator.dieu === null || new RegExp(`\\bdieu\\s+${locator.dieu}\\b`).test(content)) &&
    (locator.khoan === null || new RegExp(`\\bkhoan\\s+${locator.khoan}\\b`).test(content)) &&
    (locator.diem === null || new RegExp(`\\bdiem\\s+${locator.diem}\\b`).test(content))
  );
}

function readNumber(value: string, pattern: RegExp): number | null {
  const match = value.match(pattern)?.[1];
  return match === undefined ? null : Number(match);
}
