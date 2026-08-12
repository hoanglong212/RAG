# Parser audit D1

The decision record refers to seven traps in an older `KE-HOACH-RAG-VAN-BAN.md`, but that file is not present in this repository. The current authoritative [PLAN.md](../PLAN.md) lists twelve mandatory parser cases in section 7.4. This audit maps all twelve to automated coverage in `src/lib/parser/parser.test.ts`.

| # | Required case | Automated evidence | Status |
|---|---|---|---|
| 1 | Chương → Mục → Điều → Khoản → Điểm | `Tinh huong 1` plus D1 node hierarchy assertions | Covered |
| 2 | Điều without Chương | `Tinh huong 2` | Covered |
| 3 | Điều without Khoản | `Tinh huong 3` | Covered |
| 4 | Khoản containing Điểm a, b, c | `Tinh huong 4` | Covered |
| 5 | Number `15/2020/NĐ-CP` | `Tinh huong 5` | Covered |
| 6 | Number `08/2023/TT-BTC` | `Tinh huong 6` | Covered |
| 7 | Table between articles | `Tinh huong 7` | Covered |
| 8 | Annex separated from articles | `Tinh huong 8` | Covered |
| 9 | Article split across PDF pages | `Tinh huong 9` | Covered |
| 10 | “Điều” inside a sentence | `Tinh huong 10` and amended-document assertions | Covered |
| 11 | Roman chapter numbering | `Tinh huong 11` | Covered |
| 12 | Amending document quoting another Điều | `Tinh huong 12` | Covered |

Additional invariants:

- Vietnamese point ordering explicitly tests `a, b, c, d, đ, e` and asserts no false gap warning.
- NFC normalization is tested before structure regexes run.
- Chunk splitting above 800 estimated tokens is covered both with and without Điểm children.
- Missing article structure emits a warning rather than silently discarding input.
- D1 stable node output is tested for parent key, depth, breadcrumb, and structural chunk linkage.

Current automated result at D1: 45 tests passing across six test files.
