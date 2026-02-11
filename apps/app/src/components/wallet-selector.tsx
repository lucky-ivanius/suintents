"use client";

import { useWallet } from "@suiet/wallet-kit";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

interface WalletSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletSelector({ open, onOpenChange }: WalletSelectorProps) {
  const {
    select, // select
    configuredWallets, // default wallets
  } = useWallet();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[min(32rem,100vw)]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <ul className="flex w-full flex-col gap-2">
          {[...configuredWallets].map((wallet) => (
            <li key={wallet.name}>
              <Button
                variant="outline"
                className={cn(
                  "h-16 w-full justify-start gap-4 hover:text-primary has-data-[icon=inline-start]:pl-4",
                  wallet.installed ? "text-foreground" : "text-muted-foreground/40"
                )}
                onClick={() => {
                  if (!wallet.installed) {
                    toast.warning("Wallet not installed", {
                      closeButton: true,
                      duration: 0,
                      position: "top-right",
                      description: (
                        <p className="text-muted-foreground text-sm">
                          Please install{" "}
                          {wallet.downloadUrl.browserExtension ? (
                            <Link href={wallet.downloadUrl.browserExtension} target="_blank" className="text-primary">
                              {wallet.name}
                            </Link>
                          ) : (
                            wallet.name
                          )}{" "}
                          extension first
                        </p>
                      ),
                    });

                    return;
                  }

                  select(wallet.name);
                }}
              >
                <Image data-icon="inline-start" width="36" height="36" src={wallet.iconUrl} alt={wallet.name} />
                {wallet.name}
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
