import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@n8n/chat/style.css";
import "@uploadthing/react/styles.css";
import "driver.js/dist/driver.css";
import { AppProviders } from "@/components/providers/app-providers";
import N8NChatWidget from "@/components/providers/N8NChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fides Lex",
  description: "Asesoría Jurídica Especializada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
        <div id="n8n-chat" />
        <N8NChatWidget />
      </body>
    </html>
  );
}
