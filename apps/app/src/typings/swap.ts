import type { Asset, Network } from "@suintents/core";

export type AssetMetadata = {
  symbol: string;
  name: string;
  decimals: number;
  network: Network;
};

export type NetworkMetadata = {
  name: string;
};

export type AssetMap = Record<Asset, AssetMetadata>;
export type NetworkMap = Record<Network, NetworkMetadata>;
