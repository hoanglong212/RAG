export interface ParsedPenaltyRange {
  from: number;
  to: number;
}

export function parsePenaltyRange(text: string): ParsedPenaltyRange | null {
  const match = text.match(/phạt tiền từ\s+([\d.]+)\s*đồng\s+đến\s+([\d.]+)\s*đồng/i);
  if (!match) return null;
  const from = Number(match[1].replaceAll(".", ""));
  const to = Number(match[2].replaceAll(".", ""));
  return Number.isFinite(from) && Number.isFinite(to) ? { from, to } : null;
}
