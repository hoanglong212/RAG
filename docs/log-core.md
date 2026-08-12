# Core track log

## 2026-08-12 — Phase 3

- Added extraction for text-layer PDF, DOCX, UTF-8 TXT, and Markdown; scanned PDFs fail closed without OCR.
- Added hosted embedding adapter with batches capped at 50 and strict vector-shape validation.
- Added per-document transactional persistence, failure status recording, resilient batch CLI, and Phase 3 API routes.
- Preserved the frozen contract and existing database schema; full parser diagnostics are stored internally while API warnings use only frozen contract codes.
- Automated verification: 40 tests, TypeScript strict check, ESLint, and production build pass.
- Live acceptance remains pending because `data/raw` has no source documents and no runtime `.env` is configured in this worktree.
