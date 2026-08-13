import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * pdfjs-dist phải được nạp thẳng từ node_modules lúc chạy, KHÔNG cho
   * webpack gói vào chunk.
   *
   * Lý do: chạy trên Node không có Web Worker thật, nên pdf.js dựng "fake
   * worker" bằng cách import động `./pdf.worker.mjs` THEO ĐƯỜNG DẪN TƯƠNG
   * ĐỐI so với chính nó. Khi bị gói lại, "chính nó" nằm ở
   * `.next/server/vendor-chunks/pdfjs-dist.js`, mà Next không mang file
   * worker sang thư mục đó — nên nạp PDF nào cũng chết với:
   *
   *   Setting up fake worker failed: "Cannot find module
   *   '…/.next/server/vendor-chunks/pdf.worker.mjs'"
   *
   * Để ngoài gói thì đường dẫn tương đối trỏ về node_modules, nơi
   * pdf.worker.mjs vẫn nằm cạnh pdf.mjs.
   */
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
