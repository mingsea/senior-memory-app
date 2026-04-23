import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "记忆训练",
  description: "老年认知训练应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col bg-amber-50">{children}</body>
    </html>
  );
}
