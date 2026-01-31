"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown01Icon, ArrowUpDownIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import type { AssetWithBalance, Network } from "@/typings/swap";
import { getAssetById, getAssetWithBalanceById, getNetworkById } from "@/config/swaps";
import { cn } from "@/lib/utils";

import { AssetSelector } from "./asset-selector";
import { Avatar, AvatarBadge, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Field } from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

const swapFormSchema = z.object({
  fromAsset: z.string().refine((val) => !!getAssetById(val)),
  fromAmount: z.string(),
  toAsset: z.string().refine((val) => !!getAssetById(val)),
  toAmount: z.string(),
});

type SwapCardProps = {
  from?: string;
  to?: string;
  networks: Network[];
  assets: AssetWithBalance[];
};

export function SwapCard({ from, to, assets, networks }: SwapCardProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const swapForm = useForm<z.infer<typeof swapFormSchema>>({
    resolver: zodResolver(swapFormSchema),
    defaultValues: {
      fromAsset: from ? from.replaceAll("-", ":") : "evm:1:eth",
      fromAmount: "",
      toAsset: to ? to.replaceAll("-", ":") : "sui:mainnet:sui",
      toAmount: "",
    },
  });

  const onSwitch = () => {
    const fromAsset = swapForm.watch("fromAsset");
    const toAsset = swapForm.watch("toAsset");
    const toAmount = swapForm.watch("toAmount");

    swapForm.setValue("fromAsset", toAsset);
    swapForm.setValue("fromAmount", toAmount);
    swapForm.setValue("toAsset", fromAsset);

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("from", toAsset.replaceAll(":", "-"));
    newSearchParams.set("to", fromAsset.replaceAll(":", "-"));

    replace(`/swap?${newSearchParams.toString()}`);
  };

  const onSubmitSwap = (data: z.infer<typeof swapFormSchema>) => {
    console.log(data);
  };

  return (
    <Card className="w-full md:max-w-140">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Swap</CardTitle>
        <CardAction>
          <Button size="icon" variant="ghost" className="rounded-full">
            <HugeiconsIcon icon={Settings02Icon} className="size-5" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form onSubmit={swapForm.handleSubmit(onSubmitSwap)} className="space-y-6">
          <AssetSelector
            assets={assets}
            networks={networks}
            open={fromOpen}
            onOpenChange={setFromOpen}
            onSelect={(asset) => {
              const currentTo = swapForm.watch("toAsset");
              const newSearchParams = new URLSearchParams(searchParams);

              if (asset.id === currentTo) {
                const currentFrom = swapForm.watch("fromAsset");
                swapForm.setValue("toAsset", currentFrom);
                newSearchParams.set("to", currentFrom.replaceAll(":", "-"));
              }

              swapForm.setValue("fromAsset", asset.id);
              newSearchParams.set("from", asset.id.replaceAll(":", "-"));

              replace(`/swap?${newSearchParams.toString()}`);
            }}
            value={swapForm.watch("fromAsset")}
          />

          <AssetSelector
            assets={assets}
            networks={networks}
            open={toOpen}
            onOpenChange={setToOpen}
            onSelect={(asset) => {
              const currentFrom = swapForm.watch("fromAsset");
              const newSearchParams = new URLSearchParams(searchParams);

              if (asset.id === currentFrom) {
                const currentTo = swapForm.watch("toAsset");
                swapForm.setValue("fromAsset", currentTo);
                newSearchParams.set("from", currentTo.replaceAll(":", "-"));
              }

              swapForm.setValue("toAsset", asset.id);
              newSearchParams.set("to", asset.id.replaceAll(":", "-"));

              replace(`/swap?${newSearchParams.toString()}`);
            }}
            value={swapForm.watch("toAsset")}
          />

          <div className="space-y-1">
            <Controller
              name="fromAmount"
              control={swapForm.control}
              render={({ field, fieldState }) => {
                const assetWithBalance = getAssetWithBalanceById(swapForm.watch("fromAsset"));

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <InputGroup className="p-2">
                      <InputGroupAddon align="block-start" className="justify-between">
                        <span className="text-foreground/80 text-xs md:text-sm">Sell</span>
                        {assetWithBalance?.balance && (
                          <div className="flex items-center justify-end gap-2">
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => swapForm.setValue("fromAmount", ((assetWithBalance.balance ?? 0) / 10).toString())}
                            >
                              10%
                            </Badge>
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => swapForm.setValue("fromAmount", ((assetWithBalance.balance ?? 0) / 4).toString())}
                            >
                              25%
                            </Badge>
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => swapForm.setValue("fromAmount", ((assetWithBalance.balance ?? 0) / 2).toString())}
                            >
                              50%
                            </Badge>
                            <Badge
                              variant="outline"
                              className="cursor-pointer text-foreground/80 hover:text-foreground"
                              onClick={() => swapForm.setValue("fromAmount", (assetWithBalance.balance ?? 0).toString())}
                            >
                              Max
                            </Badge>
                          </div>
                        )}
                      </InputGroupAddon>
                      <div className="flex w-full items-center justify-between gap-2">
                        <InputGroupInput {...field} placeholder="0" type="number" className="text-2xl md:text-3xl" />
                        <InputGroupAddon align="inline-end">
                          <Controller
                            name="fromAsset"
                            control={swapForm.control}
                            render={({ field, fieldState }) => {
                              const asset = getAssetById(field.value);
                              const network = asset ? getNetworkById(asset.network) : null;

                              return (
                                <Field data-invalid={fieldState.invalid}>
                                  <Button
                                    variant="outline"
                                    size="lg"
                                    className={cn("h-11 min-w-24 rounded-full", asset ? "px-1.5 text-foreground" : "text-foreground/70")}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setFromOpen(true);
                                    }}
                                  >
                                    {asset && (
                                      <Avatar>
                                        <AvatarFallback>{asset.symbol.slice(0, 1)}</AvatarFallback>
                                        {network && <AvatarBadge className="bg-transparent ring-0">{network.name.slice(0, 1)}</AvatarBadge>}
                                      </Avatar>
                                    )}
                                    {asset?.symbol ?? "Select asset"}
                                    <HugeiconsIcon icon={ArrowDown01Icon} />
                                  </Button>
                                </Field>
                              );
                            }}
                          />
                        </InputGroupAddon>
                      </div>
                      <InputGroupAddon align="block-end">
                        <div className="flex w-full items-center justify-between gap-2">
                          <span>$1</span>
                          {assetWithBalance?.balance && (
                            <span className="text-foreground">
                              {assetWithBalance.balance} {assetWithBalance.symbol}
                            </span>
                          )}
                        </div>
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>
                );
              }}
            />
            <div className="relative z-30 flex items-center justify-center">
              <Button size="icon-lg" variant="outline" className="absolute -top-5 dark:bg-muted hover:dark:bg-input" onClick={onSwitch}>
                <HugeiconsIcon icon={ArrowUpDownIcon} />
              </Button>
            </div>
            <Controller
              name="toAmount"
              control={swapForm.control}
              render={({ field, fieldState }) => {
                const assetWithBalance = getAssetWithBalanceById(swapForm.watch("toAsset"));

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <InputGroup className="p-2">
                      <InputGroupAddon align="block-start">
                        <span className="text-foreground/80 text-xs md:text-sm">Buy</span>
                      </InputGroupAddon>
                      <div className="flex w-full items-center justify-between gap-2">
                        <InputGroupInput {...field} placeholder="0" type="number" className="text-2xl md:text-3xl" readOnly />
                        <InputGroupAddon align="inline-end">
                          <Controller
                            name="toAsset"
                            control={swapForm.control}
                            render={({ field, fieldState }) => {
                              const asset = getAssetById(field.value);
                              const network = asset ? getNetworkById(asset.network) : null;

                              return (
                                <Field data-invalid={fieldState.invalid}>
                                  <Button
                                    variant="outline"
                                    size="lg"
                                    className={cn("h-11 min-w-24 rounded-full", asset ? "px-1.5 text-foreground" : "text-foreground/70")}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setToOpen(true);
                                    }}
                                  >
                                    {asset && (
                                      <Avatar>
                                        <AvatarFallback>{asset.symbol.slice(0, 1)}</AvatarFallback>
                                        {network && <AvatarBadge className="bg-transparent ring-0">{network.name.slice(0, 1)}</AvatarBadge>}
                                      </Avatar>
                                    )}
                                    {asset?.symbol ?? "Select asset"}
                                    <HugeiconsIcon icon={ArrowDown01Icon} />
                                  </Button>
                                </Field>
                              );
                            }}
                          />
                        </InputGroupAddon>
                      </div>
                      <InputGroupAddon align="block-end">
                        <div className="flex w-full items-center justify-between gap-2">
                          <span>$1</span>
                          {assetWithBalance?.balance && (
                            <span className="text-foreground">
                              {assetWithBalance.balance} {assetWithBalance.symbol}
                            </span>
                          )}
                        </div>
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>
                );
              }}
            />
          </div>

          <Button type="submit" className="h-12 w-full">
            Swap
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
