import type { Metadata } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Mono, Literata } from "next/font/google";
import "./globals.css";

/**
 * Ba vai chu, ba viec khac nhau. Ca ba deu phai co subset "vietnamese" —
 * next/font bao loi luc build neu font khong co, nen chinh ban build la
 * buoc kiem tra bo ky tu.
 */

/**
 * Ten bien phai KHAC ten token cua Tailwind (--font-sans, --font-mono...).
 * Trung ten thi tokens.css tro nguoc ve chinh no, thanh tham chieu vong,
 * va trinh duyet roi ve font he thong ma khong bao loi gi ca.
 */

/** Giao dien va tieu de. Nguoi Viet thiet ke rieng cho tieng Viet. */
const fontSans = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Mat doc. Serif chi xuat hien trong vung van ban goc. */
const fontSerif = Literata({
  variable: "--font-literata",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600"],
  display: "swap",
});

/** So hieu va ma. `15/2020/NĐ-CP` la ma dinh danh, khong phai van xuoi. */
const fontMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tra cứu văn bản hành chính",
  description:
    "Hệ thống hỏi đáp văn bản hành chính Việt Nam có trích dẫn tới Điều, Khoản",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Bien font phai dat tren <html>, khong phai <body>: token trong
    // src/styles/tokens.css khai o :root, ma :root chinh la <html>. De o body
    // thi var(--font-be-vietnam) khong giai duoc luc tinh gia tri cua --chu-ui,
    // va toan bo bang chu im lang roi ve font he thong.
    <html
      lang="vi"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
