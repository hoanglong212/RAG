# Core track log

## 2026-08-12 — Phase 2 accepted

- Provisioned a loopback-only PostgreSQL 18 cluster with pgvector 0.8.5 and unaccent, then applied and checked the D1 migrations.
- Collected 50 official food-safety legal documents with source URLs, structural-coverage checks, and SHA-256 manifest entries.
- Added fixed-512 chunking with 64-token overlap alongside structural chunking and a local Vietnamese embedding service using `pyvi` and the BKAI bi-encoder.
- Live acceptance after the coverage correction: both strategies cover the same 50 documents and canonical legal body; 1,663 structural chunks, 305 fixed chunks, 3,379 document nodes, and 768 dimensions for every vector.
- Token audit: fixed stores 143,761 whitespace tokens including overlap (127,441 unique, 106.1% of structural); structural stores 120,109 tokens. Fixed retains node labels/titles once, explaining the small unique-token difference.

## 2026-08-12 — D1 schema restoration

- Restored stable `doc_nodes`, chunk `node_id`/`strategy`, parser warnings, legal-effect status, raw document type, and eval comparison fields without changing the frozen contract.
- Preserved migration-0000 ingest state by moving it to `ingest_status`; `trang_thai` now means legal-effect status as required by the contract.
- Structural chunks resolve to the lowest relevant stable node in the same transaction as document persistence.
- Added explicit tests for node hierarchy and Vietnamese `d → đ → e` point ordering.

## 2026-08-12 — Phase 3

- Added extraction for text-layer PDF, DOCX, UTF-8 TXT, and Markdown; scanned PDFs fail closed without OCR.
- Added hosted embedding adapter with batches capped at 50 and strict vector-shape validation.
- Added per-document transactional persistence, failure status recording, resilient batch CLI, and Phase 3 API routes.
- Preserved the frozen contract and existing database schema; full parser diagnostics are stored internally while API warnings use only frozen contract codes.
- Automated verification: 40 tests, TypeScript strict check, ESLint, and production build pass.
- Live acceptance remains pending because `data/raw` has no source documents and no runtime `.env` is configured in this worktree.

## 2026-08-12 — D8 retrieval

- Added live pgvector cosine retrieval, Vietnamese full-text retrieval with `unaccent`, exact legal-identifier boosting, and hybrid Reciprocal Rank Fusion with `k = 60`.
- Added `POST /api/search` and `scripts/thu-tim.ts` so vector, full-text, and hybrid modes can be exercised against the same corpus and chunking strategy.
- Live smoke acceptance: the query for `55/2010/QH12` returned that document at rank 1 in both vector and hybrid modes.
- Automated verification: 53 tests, TypeScript strict check, ESLint, and production build pass.
- Initial corpus expansion for `115/2018/NĐ-CP` and `124/2021/NĐ-CP` was blocked because the official 115 PDF exposes a corrupted text layer and the official 124 PDF has no text layer. The fail-closed extractor rejected both; the clean-source resolution is recorded below.

## 2026-08-12 — D7 corpus prerequisite and D9 API handoff

- Recovered clean official HTML text for `115/2018/NĐ-CP` and `124/2021/NĐ-CP` from the Ministry of Justice legal database after their signed PDFs failed extraction quality gates.
- Added both documents to the reproducible manifest and ingested each into both structural and fixed strategies. Live corpus audit: 52 documents per strategy, 385 fixed chunks, 1,923 structural chunks, no missing embeddings, and all vectors have 768 dimensions.
- Tightened exact-identifier full-text ranking so the acceptance query about the maximum fine in `115/2018/NĐ-CP` returns Điều 3 Khoản 1 at hybrid rank 1.
- Added `/api/chat` with the frozen SSE order (`citations`, `token`, `done`), confidence threshold, grounded-only prompt, query logging, and `/api/stats` backed by live PostgreSQL data. `/api/ask` remains a compatibility alias.
- Live API acceptance covered `/api/stats` and the `khong_tim_thay` SSE path. The successful LLM token path requires `LLM_API_KEY` and `LLM_MODEL`, which are not configured locally.
- Automated verification: 54 tests, TypeScript strict check, ESLint, and production build pass.

## 2026-08-12 — Groq live generation acceptance

- Added secret-safe `GROQ_API_KEY` auto-detection with the OpenAI-compatible Groq Chat Completions endpoint and production model `llama-3.3-70b-versatile`; explicit `LLM_*` settings still override the defaults.
- Live `/api/chat` acceptance for the maximum fine under `115/2018/NĐ-CP` emitted citations first, streamed the grounded Vietnamese answer with citation `[2]`, then emitted `done` with `status: ok` in 1,325 ms.
- Automated verification: 55 tests, TypeScript strict check, ESLint, and production build pass.
