import z from "zod";

export const quoteSchema = z.object({
  id: z.string(),
  publicKey: z.array(z.int().min(0).max(255)),
  assetIn: z.string(),
  assetOut: z.string(),
  exactAmountIn: z.bigint(),
  minDeadlineMs: z.int().min(0),
  createdAt: z.int(),
});
export type Quote = z.infer<typeof quoteSchema>;

export const quoteOutputSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  publicKey: z.array(z.int().min(0).max(255)),
  amountOut: z.bigint(),
  deadline: z.int(),
});
export type QuoteOutput = z.infer<typeof quoteOutputSchema>;

export const getQuoteJsonInputSchema = z.object({
  publicKey: z.array(z.int().min(0).max(255)),
  assetIn: z.string(),
  assetOut: z.string(),
  exactAmountIn: z.string().transform((v) => BigInt(v)),
  minDeadlineMs: z.int().min(0),
});
export type GetQuoteJsonInput = z.infer<typeof getQuoteJsonInputSchema>;

export const getQuoteJsonOutputSchema = z.object({
  quote: z.object({
    id: z.string(),
    publicKey: z.array(z.int().min(0).max(255)),
    assetIn: z.string(),
    assetOut: z.string(),
    exactAmountIn: z.string(),
    minDeadlineMs: z.int().min(0),
    createdAt: z.int(),
  }),
  outputs: z.array(
    z.object({
      id: z.string(),
      publicKey: z.array(z.int().min(0).max(255)),
      amountOut: z.string(),
      deadline: z.int(),
    })
  ),
});
export type GetQuoteJsonOutput = z.infer<typeof getQuoteJsonOutputSchema>;

export const submitQuoteOutputJsonSchema = z.object({
  quoteId: z.string(),

  nonce: z.array(z.int().min(0).max(255)),
  assetIn: z.string(),
  amountIn: z.string().transform((v) => BigInt(v)),
  assetOut: z.string(),
  amountOut: z.string().transform((v) => BigInt(v)),
  deadline: z.number().refine((v) => v >= Date.now()),

  algorithm: z.int(),
  publicKey: z.array(z.int().min(0).max(255)),
  signature: z.array(z.int().min(0).max(255)),
});
export type SubmitQuoteOutputJson = z.infer<typeof submitQuoteOutputJsonSchema>;
