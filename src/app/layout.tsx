import type { Metadata } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Mono, Literata } from "next/font/google";
import "./globals.css";

/**
 * Ba vai chu, ba viec khac nhau. Ca ba deu phai co subset "vietnamese" —
 * next/font bao loi luc build neu font khong co, nen chinh ban build la
 * buoc kiem tra bo ky tu.
 */

/** Giao dien va tieu de. Nguoi Viet thiet ke rieng cho tieng Viet. */
const fontSans = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Mat doc. Serif chi xuat hien trong vung van ban goc. */
const fontSerif = Literata({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600"],
  display: "swap",
});

/** So hieu va ma. `15/2020/NĐ-CP` la ma dinh danh, khong phai van xuoi. */
const fontMono = IBM_Plex_Mono({
  variable: "--font-mono",
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
    <html lang="vi">
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
