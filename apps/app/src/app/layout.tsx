import "./globals.css";

import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { Geist_Mono, Inter } from "next/font/google";

import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "suintents",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" storageKey="suintents-theme" enableSystem>
      <html lang="en" className={cn(inter.variable, geistMono.variable)} suppressHydrationWarning>
        <body className="min-h-screen antialiased">
          <Header />
          {children}
        </body>
      </html>
    </ThemeProvider>
  );
}
