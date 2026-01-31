"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";

import type { Asset, AssetWithBalance, Network } from "@/typings/swap";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getNetworkById } from "@/config/swaps";
import { cn } from "@/lib/utils";

interface AssetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: AssetWithBalance[];
  networks: Network[];
  value?: string;
  onSelect: (asset: Asset) => void;
}

function AssetSelector({ open, onOpenChange, assets, networks, value, onSelect }: AssetSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    const query = search.toLowerCase();
    return assets.filter((asset) => {
      const matchesSearch =
        !query || asset.id.toLowerCase().includes(query) || asset.symbol.toLowerCase().includes(query) || asset.name.toLowerCase().includes(query);
      const matchesNetwork = !selectedNetwork || asset.network === selectedNetwork;
      return matchesSearch && matchesNetwork;
    });
  }, [assets, search, selectedNetwork]);

  function handleSelect(asset: Asset) {
    onSelect(asset);
    onOpenChange(false);
    setSearch("");
    setSelectedNetwork(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={true} className="flex h-[min(48rem,100vh)] flex-col gap-0 p-0 md:h-[min(32rem,85vh)]">
        <DialogHeader className="gap-0">
          <DialogTitle className="px-4 pt-4 pb-3">Select asset</DialogTitle>
          <div className="px-4 pb-3">
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <HugeiconsIcon icon={Search01Icon} />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="Search by name, symbol, or address" value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
          </div>
          <div className="border-b px-4 pb-3">
            <Select value={selectedNetwork ?? ""} onValueChange={(val) => setSelectedNetwork(val || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All networks">
                  {selectedNetwork ? (
                    <>
                      <Avatar size="sm">
                        <AvatarFallback>{getNetworkById(selectedNetwork)?.name.charAt(0) ?? "?"}</AvatarFallback>
                      </Avatar>
                      {getNetworkById(selectedNetwork)?.name ?? selectedNetwork}
                    </>
                  ) : (
                    <>
                      <Avatar size="sm">
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      All networks
                    </>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <Avatar size="sm">
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  All networks
                </SelectItem>
                {networks.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    <Avatar size="sm">
                      <AvatarFallback>{network.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {network.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {filteredAssets.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">No tokens found</p>
          ) : (
            <ul>
              {filteredAssets.map((asset) => {
                const network = getNetworkById(asset.network);

                return (
                  <li key={asset.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(asset)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-input/50 focus-visible:bg-input/50 focus-visible:outline-none",
                        value === asset.id && "bg-input/20"
                      )}
                    >
                      <Avatar size="lg">
                        <AvatarFallback>{asset.symbol.slice(0, 2)}</AvatarFallback>
                        {network && <AvatarBadge className="bg-transparent ring-0">{network.name.charAt(0)}</AvatarBadge>}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{asset.symbol}</span>
                          <span className="text-muted-foreground text-xs">{asset.name}</span>
                        </div>
                        <p className="truncate text-muted-foreground text-xs">{network?.name ?? asset.network}</p>
                      </div>
                      {asset.balance && (
                        <span className="font-semibold">
                          {asset.balance} {asset.symbol}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AssetSelector };
export type { AssetSelectorProps };
