import type { Asset, Network } from "@suintents/core";

import type { AssetMap, AssetMetadata, NetworkMap, NetworkMetadata } from "@/typings/swap";

export const networks: NetworkMap = {
  "bip122:000000000019d6689c085ae165831e93": { name: "Bitcoin" },
  "eip155:1": { name: "Ethereum" },
  "eip155:8453": { name: "Base" },
  "eip155:42161": { name: "Arbitrum" },
  "sui:mainnet": { name: "Sui" },
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": { name: "Solana" },
};

export const assets: AssetMap = {
  "bip122:000000000019d6689c085ae165831e93:btc": {
    symbol: "BTC",
    name: "Bitcoin",
    decimals: 8,
    network: "bip122:000000000019d6689c085ae165831e93",
  },
  "eip155:1:eth": {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    network: "eip155:1",
  },
  "eip155:1:usdt": {
    symbol: "USDT",
    name: "Tether",
    decimals: 6,
    network: "eip155:1",
  },
  "eip155:1:usdc": {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    network: "eip155:1",
  },
  "eip155:8453:eth": {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    network: "eip155:8453",
  },
  "eip155:8453:usdc": {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    network: "eip155:8453",
  },
  "eip155:42161:eth": {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    network: "eip155:42161",
  },
  "eip155:42161:usdc": {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    network: "eip155:42161",
  },
  "sui:mainnet:sui": {
    symbol: "SUI",
    name: "Sui",
    decimals: 9,
    network: "sui:mainnet",
  },
  "sui:mainnet:usdc": {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    network: "sui:mainnet",
  },
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:sol": {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  },
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:usdc": {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  },
};

export function getAssetMetadata(id: string): AssetMetadata | undefined {
  return assets[id as Asset];
}

export function getNetworkMetadata(id: string): NetworkMetadata | undefined {
  return networks[id as Network];
}
