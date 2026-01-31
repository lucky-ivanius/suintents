import type { Asset, AssetWithBalance, Network } from "@/typings/swap";

export const networks: Network[] = [
  {
    id: "bitcoin:mainnet",
    name: "Bitcoin",
  },
  {
    id: "evm:1",
    name: "Ethereum",
  },
  {
    id: "evm:8453",
    name: "Base",
  },
  {
    id: "evm:42161",
    name: "Arbitrum",
  },
  {
    id: "sui:mainnet",
    name: "Sui",
  },
];

export const networkMap = Object.fromEntries(networks.map((network) => [network.id, network]));

export const getNetworkById = (id: string): Network | null => networkMap[id] ?? null;

export const assets: Asset[] = [
  {
    id: "bitcoin:mainnet:bitcoin",
    network: "bitcoin:mainnet",
    symbol: "BTC",
    name: "Bitcoin",
    decimals: 8,
  },
  {
    id: "evm:1:eth",
    network: "evm:1",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
  },
  {
    id: "evm:1:usdc",
    network: "evm:1",
    symbol: "USDC",
    name: "USDC",
    decimals: 6,
  },
  {
    id: "evm:8453:eth",
    network: "evm:8453",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
  },
  {
    id: "evm:8453:usdc",
    network: "evm:8453",
    symbol: "USDC",
    name: "USDC",
    decimals: 6,
  },
  {
    id: "evm:42161:eth",
    network: "evm:42161",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
  },
  {
    id: "evm:42161:usdc",
    network: "evm:42161",
    symbol: "USDC",
    name: "USDC",
    decimals: 6,
  },
  {
    id: "sui:mainnet:sui",
    network: "sui:mainnet",
    symbol: "SUI",
    name: "Sui",
    decimals: 9,
  },
  {
    id: "sui:mainnet:usdc",
    network: "sui:mainnet",
    symbol: "USDC",
    name: "USDC",
    decimals: 6,
  },
];

export const assetMap = Object.fromEntries(assets.map((asset) => [asset.id, asset]));

export const getAssetById = (id: string): Asset | null => assetMap[id] ?? null;

export const assetsWithBalance: AssetWithBalance[] = assets.map<AssetWithBalance>((asset) => ({
  ...asset,
  balance: 10,
}));

export const assetWithBalanceMap = Object.fromEntries(assetsWithBalance.map((asset) => [asset.id, asset]));

export const getAssetWithBalanceById = (id: string): AssetWithBalance | null => assetWithBalanceMap[id] ?? null;
