"use client";

import type { PropsWithChildren } from "react";
import { WalletProvider } from "@suiet/wallet-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@suiet/wallet-kit/style.css";

import { ThemeProvider } from "./theme-provider";

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" storageKey="suintents-theme" enableSystem>
        <WalletProvider>{children}</WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
