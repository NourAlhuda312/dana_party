import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "فرحة دانة",
  description: "اكتبوا لدانة كلمة حلوة تضل معها ذكرى من يوم نجاحها."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
