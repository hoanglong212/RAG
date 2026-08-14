-- Danh tính bài báo là URL, không phải cặp (nguồn, URL).
--
-- Khóa duy nhất cũ gồm cả source_id, nên từ khi mỗi tòa soạn có nhiều feed
-- chuyên mục, cùng một bài về qua hai feed thành hai dòng. Đo được 56 URL bị
-- lặp, trong đó có bài nằm ba lần: feed tổng hợp, mục Kinh doanh và mục Xe.
--
-- Ba bước phải theo đúng thứ tự này. Tạo index duy nhất trước khi dọn sẽ lỗi.

-- 1. Bỏ hai nguồn feed tổng hợp đã ngừng khai báo trong DEFAULT_NEWS_SOURCES.
--    syncAllNewsSources chỉ thêm và cập nhật nguồn, không bao giờ gỡ nguồn cũ,
--    nên chúng vẫn nằm lại cùng toàn bộ bài đã lấy về. Xóa theo feed_url chứ
--    không theo slug để nói rõ đang gỡ đúng cái gì. Bài sẽ bị xóa theo nhờ
--    ON DELETE CASCADE, và bài nào còn trong feed chuyên mục sẽ được lấy lại
--    ở lần đồng bộ kế tiếp.
DELETE FROM "news_sources"
WHERE "feed_url" IN (
  'https://tuoitre.vn/rss/tin-moi-nhat.rss',
  'https://vnexpress.net/rss/tin-moi-nhat.rss'
);
--> statement-breakpoint

-- 2. Gộp phần trùng còn lại, giữ dòng lấy về sớm nhất cho mỗi URL.
--    Bước 1 chưa dọn hết: một bài vẫn có thể nằm ở hai feed chuyên mục của
--    cùng một báo, ví dụ vừa Kinh doanh vừa Xe.
DELETE FROM "news_articles" a
USING "news_articles" b
WHERE a."external_id" = b."external_id"
  AND (a."fetched_at" > b."fetched_at"
       OR (a."fetched_at" = b."fetched_at" AND a."id" > b."id"));
--> statement-breakpoint

-- 3. Giờ mới đổi được khóa duy nhất.
DROP INDEX "news_articles_source_external_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "news_articles_external_uidx" ON "news_articles" USING btree ("external_id");
