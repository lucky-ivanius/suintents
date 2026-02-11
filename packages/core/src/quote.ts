import { z } from "zod";

import { asset } from "./asset";
import { bytes } from "./bytes";
import { createBase64Codec } from "./codec";
import { signedMessageSchema } from "./signature";

/* Quote */
export const quotePrimitives = {
  id: z.string(),
  assetIn: asset,
  assetOut: asset,
  minDeadlineMs: z.uint32(),
  createdAt: z.number(),
};

export const quoteExactAmountInSchema = z.object({
  type: z.literal("exactAmountIn"),
  exactAmountIn: z.bigint(),
  ...quotePrimitives,
});
export type QuoteExactAmountIn = z.infer<typeof quoteExactAmountInSchema>;

export const quoteExactAmountOutSchema = z.object({
  type: z.literal("exactAmountOut"),
  exactAmountOut: z.bigint(),
  ...quotePrimitives,
});
export type QuoteExactAmountOut = z.infer<typeof quoteExactAmountOutSchema>;

export const quoteSchema = z.discriminatedUnion("type", [quoteExactAmountInSchema, quoteExactAmountOutSchema]);
export type Quote = z.infer<typeof quoteSchema>;

export const quoteStore = createBase64Codec(quoteSchema);

/* Quote Offer */
export const quoteOfferPrimitives = {
  id: z.string(),
  quoteId: z.string(),
  signedMessage: signedMessageSchema,
  deadline: z.number(),
};

export const quoteOfferExactAmountInSchema = z.object({
  type: z.literal("exactAmountIn"),
  amountOut: z.bigint(),
  ...quoteOfferPrimitives,
});
export type QuoteOfferExactAmountIn = z.infer<typeof quoteOfferExactAmountInSchema>;

export const quoteOfferExactAmountOutSchema = z.object({
  type: z.literal("exactAmountOut"),
  amountIn: z.bigint(),
  ...quoteOfferPrimitives,
});
export type QuoteOfferExactAmountOut = z.infer<typeof quoteOfferExactAmountOutSchema>;

export const quoteOfferSchema = z.discriminatedUnion("type", [quoteOfferExactAmountInSchema, quoteOfferExactAmountOutSchema]);
export type QuoteOffer = z.infer<typeof quoteOfferSchema>;

export const quoteOfferStore = createBase64Codec(quoteOfferSchema);
