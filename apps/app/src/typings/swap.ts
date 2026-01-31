import z from "zod";

export const networkSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Network = z.infer<typeof networkSchema>;

export const assetSchema = z.object({
  id: z.string(),
  network: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.int(),
});

export type Asset = z.infer<typeof assetSchema>;

export const assetWithBalanceSchema = assetSchema.extend({
  balance: z.number().optional(),
});

export type AssetWithBalance = z.infer<typeof assetWithBalanceSchema>;
