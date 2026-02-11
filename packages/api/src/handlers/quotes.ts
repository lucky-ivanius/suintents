import { sleep } from "bun";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { v4 } from "uuid";
import z from "zod";

import type { Quote } from "../core/quote";
import type { Env } from "../env";
import type { SuintentsAlgorithm } from "../lib/sui";
import { asset } from "../core/asset";
import { byteArrayToBytes, bytesToByteArray } from "../core/bytes";
import {
  quoteExactAmountInSchema,
  quoteExactAmountOutSchema,
  quoteOfferExactAmountInSchema,
  quoteOfferExactAmountOutSchema,
  quoteOfferStore,
  quoteStore,
} from "../core/quote";
import { verifySignedMessage } from "../lib/crypto";
import {
  getSuintentsAlgorithmName,
  suintentsIntentPayloadStruct,
  suintentsModule,
  suintentsPackageId,
  suintentsStateObjectId,
  toSuintentsSignedMessage,
} from "../lib/sui";
import { badRequest, notFound, ok } from "../utils/response";
import { fromSchema } from "../utils/validation";

const quoteHandlers = new Hono<Env>();

/* Get quote - POST / */
const getQuoteJsonRequestPrimitives = {
  assetIn: asset,
  assetOut: asset,
  minDeadlineMs: z
    .uint32()
    .min(1)
    .max(1000 * 60 * 5),
};

const getQuoteExactAmountInJsonRequestSchema = z.object({
  type: z.literal("exactAmountIn"),
  exactAmountIn: z.string().transform(BigInt).pipe(z.bigint().min(1n)),
  ...getQuoteJsonRequestPrimitives,
});

const getQuoteExactAmountOutJsonRequestSchema = z.object({
  type: z.literal("exactAmountOut"),
  exactAmountOut: z.string().transform(BigInt).pipe(z.bigint().min(1n)),
  ...getQuoteJsonRequestPrimitives,
});

const getQuoteJsonRequestSchema = z
  .discriminatedUnion("type", [getQuoteExactAmountInJsonRequestSchema, getQuoteExactAmountOutJsonRequestSchema])
  .refine(({ assetIn, assetOut }) => assetIn !== assetOut, { path: ["assetIn", "assetOut"] });

const getQuoteExactAmountInJsonResponseSchema = quoteOfferExactAmountInSchema
  .omit({ quoteId: true, signedMessage: true, type: true })
  .extend({ amountOut: z.bigint().transform(String), solver: bytesToByteArray });

const getQuoteExactAmountOutJsonResponseSchema = quoteOfferExactAmountOutSchema
  .omit({ quoteId: true, signedMessage: true, type: true })
  .extend({ amountIn: z.bigint().transform(String), solver: bytesToByteArray });

const getQuoteJsonResponseSchema = z.discriminatedUnion("type", [
  quoteExactAmountInSchema.extend({
    exactAmountIn: z.bigint().transform(String),
    offers: z.array(getQuoteExactAmountInJsonResponseSchema),
  }),
  quoteExactAmountOutSchema.extend({
    exactAmountOut: z.bigint().transform(String),
    offers: z.array(getQuoteExactAmountOutJsonResponseSchema),
  }),
]);

quoteHandlers.post("/", validator("json", fromSchema(getQuoteJsonRequestSchema)), async (c) => {
  const redis = c.get("REDIS");
  const redisPublisher = c.get("REDIS_PUBLISHER");
  const body = c.req.valid("json");

  const quote: Quote = {
    id: v4(),
    createdAt: Date.now(),
    ...body,
  };

  const serializedQuote = quoteStore.encode(quote);
  await Promise.all([redis.setex(`quote:${quote.id}`, 300, serializedQuote), redisPublisher.publish("quotes", serializedQuote)]);

  await sleep(3000);

  const quoteOfferIds = await redis.lrange(`quote:${quote.id}:offers`, 0, -1);
  if (!quoteOfferIds.length) {
    redis.del(`quote:${quote.id}:offers`);

    const result = getQuoteJsonResponseSchema.decode({
      ...quote,
      offers: [],
    });

    return ok(c, result);
  }

  const storedQuoteOffers = await redis.mget(...quoteOfferIds.map((quoteOfferId) => `quote-offer:${quoteOfferId}`));
  if (!storedQuoteOffers.length) {
    const result = getQuoteJsonResponseSchema.decode({
      ...quote,
      offers: [],
    });

    return ok(c, result);
  }

  const quoteOffers = storedQuoteOffers.filter(Boolean).map((storedQuoteOffer) => {
    const { signedMessage, quoteId, type, ...quoteOffer } = quoteOfferStore.decode(storedQuoteOffer);

    return { ...quoteOffer, solver: signedMessage.publicKey };
  });

  const result = getQuoteJsonResponseSchema.parse({
    ...quote,
    offers: quoteOffers,
  });

  return ok(c, result);
});

/* Accept quote offer - POST /offers/:quoteOfferId/accept */
const acceptQuoteOfferParamRequestSchema = z.object({
  quoteOfferId: z.string(),
});

const acceptQuoteOfferJsonRequestSchema = z.object({
  publicKey: byteArrayToBytes,
  message: byteArrayToBytes,
  signature: byteArrayToBytes,
});

const acceptQuoteOfferJsonResponseSchema = z.object({
  digest: z.base64(),
});

quoteHandlers.post(
  "/offers/:quoteOfferId/accept",
  validator("param", fromSchema(acceptQuoteOfferParamRequestSchema)),
  validator("json", fromSchema(acceptQuoteOfferJsonRequestSchema)),
  async (c) => {
    const redis = c.get("REDIS");

    const { quoteOfferId } = c.req.valid("param");
    const signedMessage = c.req.valid("json");

    const storedQuoteOffer = await redis.get(`quote-offer:${quoteOfferId}`);
    if (!storedQuoteOffer) return notFound(c, { code: "quote_offer_not_found", message: "Quote offer not found or expired" });

    const quoteOffer = quoteOfferStore.decode(storedQuoteOffer);

    const storedQuote = await redis.get(`quote:${quoteOffer.quoteId}`);
    if (!storedQuote) return badRequest(c, { code: "invalid_quote", message: "Invalid quote" });

    const quote = quoteStore.decode(storedQuote);

    const userIntentPayload = suintentsIntentPayloadStruct.parse(signedMessage.message);

    if (quote.assetIn !== userIntentPayload.asset_in) return;
    if (quote.assetOut !== userIntentPayload.asset_out) return;

    switch (quote.type) {
      case "exactAmountIn":
        if (quote.exactAmountIn !== BigInt(userIntentPayload.amount_in)) return;
        break;
      case "exactAmountOut":
        if (quote.exactAmountOut !== BigInt(userIntentPayload.amount_out)) return;
        break;
      default:
        return;
    }

    const algorithm = getSuintentsAlgorithmName(userIntentPayload.algorithm as SuintentsAlgorithm);
    if (!algorithm) return badRequest(c, { code: "unsupported_algorithm", message: "Unsupported signing algorithm" });

    const isValidSignedMessage = verifySignedMessage(algorithm, signedMessage);
    if (!isValidSignedMessage) return;

    const userSuintentsSignedMessage = toSuintentsSignedMessage(signedMessage);
    const solverSuintentsSignedMessage = toSuintentsSignedMessage(quoteOffer.signedMessage);

    const tx = new Transaction();

    tx.moveCall({
      package: suintentsPackageId,
      module: suintentsModule,
      function: "execute_intents",
      arguments: [
        tx.object(suintentsStateObjectId),
        tx.pure.vector("u8", userSuintentsSignedMessage),
        tx.pure.vector("u8", solverSuintentsSignedMessage),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const suiGrpcClient = c.get("SUI_GRPC_CLIENT");
    const relayerKeypair = c.get("RELAYER_KEYPAIR");

    const executeIntentsResult = await suiGrpcClient.signAndExecuteTransaction({
      signer: relayerKeypair,
      transaction: tx,
    });

    if (executeIntentsResult.FailedTransaction)
      return badRequest(c, { code: "suintents_execute_intents_failed", message: "Failed to execute intents transaction" });

    const result = acceptQuoteOfferJsonResponseSchema.encode({
      digest: executeIntentsResult.Transaction.digest,
    });

    return ok(c, result);
  }
);

export { quoteHandlers };
