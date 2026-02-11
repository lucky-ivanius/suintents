import { z } from "zod";

export const networks = [
  "bip122:000000000019d6689c085ae165831e93",
  "eip155:1",
  "eip155:8453",
  "eip155:42161",
  "sui:mainnet",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
] as const;

export const network = z.enum(networks);
export type Network = z.infer<typeof network>;
