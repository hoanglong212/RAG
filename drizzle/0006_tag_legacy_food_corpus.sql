-- Các văn bản không gắn chủ đề ở thời điểm migration là corpus ATTP legacy
-- đã được kiểm tra theo manifest thu thập cũ (52 văn bản, 2010–2021).
UPDATE "documents"
SET "legal_topics" = ARRAY['an_toan_thuc_pham']::text[]
WHERE cardinality("legal_topics") = 0;
