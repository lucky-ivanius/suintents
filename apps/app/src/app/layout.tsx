import "./globals.css";

import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { Geist_Mono, Inter } from "next/font/google";

import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
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
    <html lang="en" className={cn(inter.variable, geistMono.variable)} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <Toaster />
          <Header />
          <main className="min-h-[calc(100vh-4rem)] w-full bg-linear-to-b from-background to-primary/30 p-4 md:to-primary/50 dark:to-primary/30 dark:md:to-primary/15">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
