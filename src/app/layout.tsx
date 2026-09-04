import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pequenos Discípulos — Histórias bíblicas na idade certa",
  description: "Histórias bíblicas personalizadas para cada fase do crescimento do seu pequeno.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${fraunces.variable} ${dmSans.variable}`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
