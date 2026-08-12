import { XMLParser } from "fast-xml-parser";
import { classifyNews } from "./classifier";

export interface ParsedNewsItem {
  title: string;
  summary: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  topics: string[];
  keywords: string[];
  locations: string[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  htmlEntities: true,
  processEntities: true,
  trimValues: true,
});

export function parseNewsFeed(xml: string): ParsedNewsItem[] {
  const root = parser.parse(xml) as Record<string, unknown>;
  const rssItems = asArray(readPath(root, ["rss", "channel", "item"]));
  const atomItems = asArray(readPath(root, ["feed", "entry"]));
  return [...rssItems, ...atomItems]
    .map(parseItem)
    .filter((item): item is ParsedNewsItem => item !== null);
}

function parseItem(value: unknown): ParsedNewsItem | null {
  if (!isRecord(value)) return null;
  const title = cleanText(readText(value.title));
  const rawSummary = readText(value.description) || readText(value.summary) || readText(value["content:encoded"]);
  const summary = cleanText(stripHtml(rawSummary));
  const url = canonicalizeUrl(readLink(value.link));
  if (!title || !url) return null;
  const publishedAt = parseDate(readText(value.pubDate) || readText(value.published) || readText(value.updated));
  const imageUrl = findImageUrl(value, rawSummary);
  const classification = classifyNews(`${title}\n${summary}`);
  return {
    title,
    summary: summary || null,
    url,
    imageUrl,
    publishedAt,
    topics: classification.topics,
    keywords: classification.keywords,
    locations: [],
  };
}

export function canonicalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || ["fbclid", "gclid"].includes(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    return url.toString();
  } catch {
    return "";
  }
}

function readLink(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const alternate = value.find((item) => isRecord(item) && item["@_rel"] === "alternate");
    return readLink(alternate ?? value[0]);
  }
  if (isRecord(value)) return readText(value["@_href"]) || readText(value["#text"]);
  return "";
}

function findImageUrl(item: Record<string, unknown>, html: string): string | null {
  const candidates = [item.enclosure, item["media:content"], item["media:thumbnail"]];
  for (const candidate of candidates) {
    for (const entry of asArray(candidate)) {
      if (!isRecord(entry)) continue;
      const url = readText(entry["@_url"]);
      if (canonicalizeUrl(url)) return url;
    }
  }
  const fromHtml = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? "";
  return canonicalizeUrl(fromHtml) || null;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 5_000);
}

function readText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (isRecord(value)) return readText(value["#text"]);
  return "";
}

function readPath(value: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), value);
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
