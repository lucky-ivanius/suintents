import { z } from "zod";

import { network } from "./network";

export const assetLiteral = z.templateLiteral([network, ":", z.string()]);
export type AssetLiteral = z.infer<typeof assetLiteral>;

export const assets = [
  "bip122:000000000019d6689c085ae165831e93:btc",
  "eip155:1:eth",
  "eip155:1:usdt",
  "eip155:1:usdc",
  "eip155:8453:eth",
  "eip155:8453:usdc",
  "eip155:42161:eth",
  "eip155:42161:usdc",
  "sui:mainnet:sui",
  "sui:mainnet:usdc",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:sol",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:usdc",
] as const satisfies AssetLiteral[];

export const asset = z.enum(assets);
export type Asset = z.infer<typeof asset>;
