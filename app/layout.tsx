import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "RestedXP Re-Encrypt",
  description:
    "Re-encrypt RestedXP guide exports for a different BattleTag",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${unbounded.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
