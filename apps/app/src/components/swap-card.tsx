"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown01Icon, ArrowUpDownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useWallet } from "@suiet/wallet-kit";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { assets, getAssetMetadata, getNetworkMetadata, networks } from "@/config/swaps";
import { cn } from "@/lib/utils";

import { AssetSelector } from "./asset-selector";
import { Avatar, AvatarBadge, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FieldError } from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { WalletSelector } from "./wallet-selector";

/* ─── Types ─── */

type QuoteMode = "exactAmountIn" | "exactAmountOut";

type QuoteOfferBase = {
  id: string;
  deadline: number;
  solver: number[];
};

type ExactAmountInResponse = {
  type: "exactAmountIn";
  id: string;
  assetIn: string;
  assetOut: string;
  exactAmountIn: string;
  minDeadlineMs: number;
  createdAt: number;
  offers: Array<QuoteOfferBase & { amountOut: string }>;
};

type ExactAmountOutResponse = {
  type: "exactAmountOut";
  id: string;
  assetIn: string;
  assetOut: string;
  exactAmountOut: string;
  minDeadlineMs: number;
  createdAt: number;
  offers: Array<QuoteOfferBase & { amountIn: string }>;
};

type QuoteResponse = ExactAmountInResponse | ExactAmountOutResponse;

/* ─── Schema ─── */

const swapFormSchema = z.object({
  assetIn: z.string().min(1),
  amountIn: z.string().min(1, "Amount is required"),
  assetOut: z.string().min(1),
  amountOut: z.string().min(1, "Amount is required"),
});

/* ─── Quote countdown timer ─── */

function QuoteCountdown({ deadline, createdAt, onExpired }: { deadline: number; createdAt: number; onExpired: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Date.now()));

  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    const tick = () => {
      const r = Math.max(0, deadline - Date.now());
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpiredRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const totalDuration = deadline - createdAt;
  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const seconds = Math.ceil(remaining / 1000);

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex size-8 items-center justify-center">
      <svg className="size-8 -rotate-90" viewBox="0 0 36 36">
        <title>Countdown</title>
        <circle cx="18" cy="18" r={radius} fill="none" stroke="currentColor" className="text-border" strokeWidth="2.5" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-medium text-[10px] text-foreground tabular-nums">{seconds}s</span>
    </div>
  );
}

/* ─── Swap card ─── */

type SwapCardProps = {
  from?: string;
  to?: string;
};

export function SwapCard({ from, to }: SwapCardProps) {
  const { connected } = useWallet();
  const [assetInOpen, setAssetInOpen] = useState(false);
  const [assetOutOpen, setAssetOutOpen] = useState(false);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [quoteMode, setQuoteMode] = useState<QuoteMode>("exactAmountIn");

  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const swapForm = useForm<z.infer<typeof swapFormSchema>>({
    resolver: zodResolver(swapFormSchema),
    defaultValues: {
      assetIn: from ? from.replaceAll("-", ":") : "bip122:000000000019d6689c085ae165831e93:btc",
      amountIn: "",
      assetOut: to ? to.replaceAll("-", ":") : "sui:mainnet:sui",
      amountOut: "",
    },
  });

  const assetIn = swapForm.watch("assetIn");
  const amountIn = swapForm.watch("amountIn");
  const assetOut = swapForm.watch("assetOut");
  const amountOut = swapForm.watch("amountOut");

  /* Debounce the active input */
  const activeAmount = quoteMode === "exactAmountIn" ? amountIn : amountOut;
  const [debouncedAmount, setDebouncedAmount] = useState(activeAmount);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAmount(activeAmount), 500);
    return () => clearTimeout(timer);
  }, [activeAmount]);

  /* Compute raw amount for the API */
  const activeAssetMeta = quoteMode === "exactAmountIn" ? getAssetMetadata(assetIn) : getAssetMetadata(assetOut);

  const rawAmount = useMemo(() => {
    if (!activeAssetMeta || !debouncedAmount) return "";
    const parsed = Number.parseFloat(debouncedAmount);
    if (Number.isNaN(parsed) || parsed <= 0) return "";
    return BigInt(Math.round(parsed * 10 ** activeAssetMeta.decimals)).toString();
  }, [activeAssetMeta, debouncedAmount]);

  /* Fetch quote */
  const quoteQuery = useQuery({
    queryKey: ["quote", assetIn, assetOut, quoteMode, rawAmount],
    queryFn: async () => {
      const base = { assetIn, assetOut, minDeadlineMs: 60000 };
      const body =
        quoteMode === "exactAmountIn"
          ? { ...base, type: "exactAmountIn" as const, exactAmountIn: rawAmount }
          : { ...base, type: "exactAmountOut" as const, exactAmountOut: rawAmount };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to fetch quote");
      return res.json() as Promise<QuoteResponse>;
    },
    enabled: !!rawAmount && assetIn !== assetOut,
    gcTime: 0,
    staleTime: 0,
  });

  /* Clear computed field when there is no valid input */
  useEffect(() => {
    if (rawAmount) return;
    const passiveField = quoteMode === "exactAmountIn" ? "amountOut" : "amountIn";
    swapForm.setValue(passiveField, "");
    swapForm.clearErrors(passiveField);
  }, [rawAmount, quoteMode, swapForm]);

  /* Populate computed field from quote response */
  useEffect(() => {
    if (!quoteQuery.data) return;

    const { offers } = quoteQuery.data;

    if (offers.length === 0) {
      const passiveField = quoteMode === "exactAmountIn" ? "amountOut" : "amountIn";
      swapForm.setValue(passiveField, "");
      swapForm.setError(passiveField, { type: "manual", message: "No route found." });
      return;
    }

    if (quoteQuery.data.type === "exactAmountIn") {
      const best = quoteQuery.data.offers.reduce((a, b) => (BigInt(a.amountOut) > BigInt(b.amountOut) ? a : b));
      const outMeta = getAssetMetadata(assetOut);
      swapForm.setValue("amountOut", outMeta ? (Number(best.amountOut) / 10 ** outMeta.decimals).toString() : best.amountOut);
      swapForm.clearErrors("amountOut");
    } else {
      const best = quoteQuery.data.offers.reduce((a, b) => (BigInt(a.amountIn) < BigInt(b.amountIn) ? a : b));
      const inMeta = getAssetMetadata(assetIn);
      swapForm.setValue("amountIn", inMeta ? (Number(best.amountIn) / 10 ** inMeta.decimals).toString() : best.amountIn);
      swapForm.clearErrors("amountIn");
    }
  }, [quoteQuery.data, quoteMode, assetIn, assetOut, swapForm]);

  /* Timer data */
  const quoteDeadlineInfo = useMemo(() => {
    if (!quoteQuery.data?.offers?.length) return null;
    const earliestDeadline = Math.min(...quoteQuery.data.offers.map((o) => o.deadline));
    return { deadline: earliestDeadline, createdAt: quoteQuery.data.createdAt };
  }, [quoteQuery.data]);

  const handleDeadlineExpired = useCallback(() => {
    quoteQuery.refetch();
  }, [quoteQuery]);

  /* Switch sell ↔ buy */
  const onSwitch = () => {
    const curIn = swapForm.getValues("assetIn");
    const curOut = swapForm.getValues("assetOut");
    const curAmountOut = swapForm.getValues("amountOut");

    swapForm.setValue("assetIn", curOut);
    swapForm.setValue("assetOut", curIn);
    swapForm.setValue("amountIn", curAmountOut);
    swapForm.setValue("amountOut", "");
    swapForm.clearErrors();
    setQuoteMode("exactAmountIn");

    const params = new URLSearchParams(searchParams);
    params.set("from", curOut.replaceAll(":", "-"));
    params.set("to", curIn.replaceAll(":", "-"));
    replace(`/swap?${params.toString()}`);
  };

  /* Balances — TODO: replace with real balance fetching */
  const getBalance = (_assetId: string): number => 1000000;
  const assetInMeta = getAssetMetadata(assetIn);
  const assetOutMeta = getAssetMetadata(assetOut);

  // Format balances with proper decimals
  const assetInBalance = assetInMeta ? getBalance(assetIn) / 10 ** assetInMeta.decimals : 0;
  const assetOutBalance = assetOutMeta ? getBalance(assetOut) / 10 ** assetOutMeta.decimals : 0;

  const setPercentage = (field: "amountIn" | "amountOut", pct: number) => {
    const balance = field === "amountIn" ? assetInBalance : assetOutBalance;

    const amount = balance * pct;
    swapForm.setValue(field, amount.toString());
    swapForm.clearErrors();

    if (field === "amountIn" && quoteMode !== "exactAmountIn") {
      setQuoteMode("exactAmountIn");
      swapForm.setValue("amountOut", "");
    } else if (field === "amountOut" && quoteMode !== "exactAmountOut") {
      setQuoteMode("exactAmountOut");
      swapForm.setValue("amountIn", "");
    }
  };

  const onSubmitSwap = (data: z.infer<typeof swapFormSchema>) => {
    console.log("Swap:", data, quoteQuery.data);
  };

  return (
    <>
      {/* Asset selector dialogs */}
      <AssetSelector
        assets={assets}
        networks={networks}
        open={assetInOpen}
        onOpenChange={setAssetInOpen}
        value={assetIn}
        onSelect={(assetId) => {
          const currentOut = swapForm.getValues("assetOut");
          const params = new URLSearchParams(searchParams);

          if (assetId === currentOut) {
            const currentIn = swapForm.getValues("assetIn");
            swapForm.setValue("assetOut", currentIn);
            params.set("to", currentIn.replaceAll(":", "-"));
          }

          swapForm.setValue("assetIn", assetId);
          params.set("from", assetId.replaceAll(":", "-"));
          replace(`/swap?${params.toString()}`);
        }}
      />
      <AssetSelector
        assets={assets}
        networks={networks}
        open={assetOutOpen}
        onOpenChange={setAssetOutOpen}
        value={assetOut}
        onSelect={(assetId) => {
          const currentIn = swapForm.getValues("assetIn");
          const params = new URLSearchParams(searchParams);

          if (assetId === currentIn) {
            const currentOut = swapForm.getValues("assetOut");
            swapForm.setValue("assetIn", currentOut);
            params.set("from", currentOut.replaceAll(":", "-"));
          }

          swapForm.setValue("assetOut", assetId);
          params.set("to", assetId.replaceAll(":", "-"));
          replace(`/swap?${params.toString()}`);
        }}
      />

      <Card className="w-full bg-transparent py-2 shadow-none ring-0 md:max-w-140">
        <CardHeader className="px-0.5">
          <CardTitle className="text-xl">Swap</CardTitle>
          <CardAction>
            {quoteQuery.isFetching ? (
              <div className="flex size-8 items-center justify-center">
                <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : quoteDeadlineInfo ? (
              <QuoteCountdown deadline={quoteDeadlineInfo.deadline} createdAt={quoteDeadlineInfo.createdAt} onExpired={handleDeadlineExpired} />
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent className="px-0.5">
          <form onSubmit={swapForm.handleSubmit(onSubmitSwap)} className="space-y-6">
            <div className="space-y-1">
              {/* ── Sell (amountIn) ── */}
              <Controller
                name="amountIn"
                control={swapForm.control}
                render={({ field, fieldState }) => {
                  const meta = getAssetMetadata(assetIn);
                  const networkMeta = meta ? getNetworkMetadata(meta.network) : null;
                  const isComputed = quoteMode === "exactAmountOut";

                  return (
                    <InputGroup className="group/sell bg-background p-2">
                      <InputGroupAddon align="block-start" className="justify-between">
                        <span className="text-foreground/80 text-xs md:text-sm">Sell</span>
                        {assetInBalance > 0 && (
                          <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-focus-within/sell:opacity-100">
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => setPercentage("amountIn", 0.25)}
                            >
                              25%
                            </Badge>
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => setPercentage("amountIn", 0.5)}
                            >
                              50%
                            </Badge>
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => setPercentage("amountIn", 1)}
                            >
                              100%
                            </Badge>
                          </div>
                        )}
                      </InputGroupAddon>
                      <div className="flex w-full items-center justify-between gap-2">
                        <InputGroupInput
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            swapForm.clearErrors();
                            if (quoteMode !== "exactAmountIn") {
                              setQuoteMode("exactAmountIn");
                              swapForm.setValue("amountOut", "");
                            }
                          }}
                          placeholder="0"
                          type="number"
                          className={cn("text-2xl md:text-3xl", isComputed && "text-foreground/60")}
                        />
                        <InputGroupAddon align="inline-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className={cn("h-11 min-w-24 rounded-full", meta ? "px-1.5 text-foreground" : "text-foreground/70")}
                            onClick={() => setAssetInOpen(true)}
                          >
                            {meta && (
                              <Avatar>
                                <AvatarFallback>{meta.symbol.slice(0, 1)}</AvatarFallback>
                                {networkMeta && <AvatarBadge className="bg-transparent ring-0">{networkMeta.name.slice(0, 1)}</AvatarBadge>}
                              </Avatar>
                            )}
                            {meta?.symbol ?? "Select asset"}
                            <HugeiconsIcon icon={ArrowDown01Icon} />
                          </Button>
                        </InputGroupAddon>
                      </div>
                      <InputGroupAddon align="block-end" className="justify-between">
                        <span>{fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}</span>
                        <span className="text-foreground">
                          {assetInBalance} {assetInMeta?.symbol}
                        </span>
                      </InputGroupAddon>
                    </InputGroup>
                  );
                }}
              />

              {/* ── Switch button ── */}
              <div className="relative z-30 flex items-center justify-center">
                <Button type="button" size="icon-lg" variant="outline" className="absolute -top-5 dark:bg-muted hover:dark:bg-input" onClick={onSwitch}>
                  <HugeiconsIcon icon={ArrowUpDownIcon} />
                </Button>
              </div>

              {/* ── Buy (amountOut) ── */}
              <Controller
                name="amountOut"
                control={swapForm.control}
                render={({ field, fieldState }) => {
                  const meta = getAssetMetadata(assetOut);
                  const networkMeta = meta ? getNetworkMetadata(meta.network) : null;
                  const isComputed = quoteMode === "exactAmountIn";

                  return (
                    <InputGroup className="group/buy bg-background p-2">
                      <InputGroupAddon align="block-start" className="justify-between">
                        <span className="text-foreground/80 text-xs md:text-sm">Buy</span>
                        {assetOutBalance > 0 && (
                          <div className="flex items-center gap-1.5 opacity-0 transition-transform group-focus-within/buy:opacity-100">
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => setPercentage("amountOut", 0.25)}
                            >
                              25%
                            </Badge>
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => setPercentage("amountOut", 0.5)}
                            >
                              50%
                            </Badge>
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => setPercentage("amountOut", 1)}
                            >
                              100%
                            </Badge>
                          </div>
                        )}
                      </InputGroupAddon>
                      <div className="flex w-full items-center justify-between gap-2">
                        <InputGroupInput
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            swapForm.clearErrors();
                            if (quoteMode !== "exactAmountOut") {
                              setQuoteMode("exactAmountOut");
                              swapForm.setValue("amountIn", "");
                            }
                          }}
                          placeholder="0"
                          type="number"
                          className={cn("text-2xl md:text-3xl", isComputed && "text-foreground/60")}
                        />
                        <InputGroupAddon align="inline-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className={cn("h-11 min-w-24 rounded-full", meta ? "px-1.5 text-foreground" : "text-foreground/70")}
                            onClick={() => setAssetOutOpen(true)}
                          >
                            {meta && (
                              <Avatar>
                                <AvatarFallback>{meta.symbol.slice(0, 1)}</AvatarFallback>
                                {networkMeta && <AvatarBadge className="bg-transparent ring-0">{networkMeta.name.slice(0, 1)}</AvatarBadge>}
                              </Avatar>
                            )}
                            {meta?.symbol ?? "Select asset"}
                            <HugeiconsIcon icon={ArrowDown01Icon} />
                          </Button>
                        </InputGroupAddon>
                      </div>
                      <InputGroupAddon align="block-end" className="justify-between">
                        <span>{fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}</span>
                        <span className="text-foreground">
                          {assetOutBalance} {assetOutMeta?.symbol}
                        </span>
                      </InputGroupAddon>
                    </InputGroup>
                  );
                }}
              />
            </div>

            {connected ? (
              <Button type="submit" className="h-12 w-full" disabled={quoteQuery.isFetching}>
                {quoteQuery.isFetching ? "Fetching quote..." : "Swap"}
              </Button>
            ) : (
              <>
                <Button type="button" size="lg" className="h-12 w-full" onClick={() => setWalletSelectorOpen(true)}>
                  Connect
                </Button>
                <WalletSelector open={walletSelectorOpen} onOpenChange={setWalletSelectorOpen} />
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
