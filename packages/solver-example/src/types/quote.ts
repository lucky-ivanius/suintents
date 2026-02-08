import { z } from "zod";

export const quoteReceivedJsonSchema = z.object({
  id: z.string(),
  publicKey: z.array(z.int().min(0).max(255)),
  assetIn: z.string(),
  assetOut: z.string(),
  exactAmountIn: z.string().transform((v) => BigInt(v)),
  minDeadlineMs: z.int().min(0),
  createdAt: z.int(),
});
export type QuoteReceivedJson = z.infer<typeof quoteReceivedJsonSchema>;

export const submitQuoteOutputJsonSchema = z.object({
  quoteId: z.string(),

  nonce: z.array(z.int().min(0).max(255)),
  assetIn: z.string(),
  amountIn: z.string(),
  assetOut: z.string(),
  amountOut: z.string(),
  deadline: z.number(),

  algorithm: z.int(),
  publicKey: z.array(z.int().min(0).max(255)),
  signature: z.array(z.int().min(0).max(255)),
});
export type SubmitQuoteOutputJson = z.infer<typeof submitQuoteOutputJsonSchema>;
