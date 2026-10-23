import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HRS EQ game — ケースで見つける、ソフトスキルの傾向。",
  description: "仕事のケーススタディ10問から、ソフトスキルに関する選択傾向を振り返るゲーム。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body suppressHydrationWarning>{children}</body></html>;
}
