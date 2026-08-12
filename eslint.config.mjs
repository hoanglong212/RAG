import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Script của skill, không phải mã nguồn dự án — để lọt vào đây thì
      // cảnh báo thật của src/ bị chìm giữa hàng trăm dòng của công cụ.
      ".claude/**",
      ".impeccable/**",
    ],
  },
];

export default eslintConfig;
