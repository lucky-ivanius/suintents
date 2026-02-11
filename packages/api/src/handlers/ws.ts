import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { v4 } from "uuid";
import { z } from "zod";

import { byteArrayToBytes } from "@suintents/core/bytes";
import {
  quoteExactAmountInSchema,
  quoteExactAmountOutSchema,
  quoteOfferExactAmountInSchema,
  quoteOfferExactAmountOutSchema,
  quoteOfferStore,
  quoteStore,
} from "@suintents/core/quote";
import { getAlgorithmName, intentPayloadStruct } from "@suintents/sui-types";

import type { Env } from "../env";
import { verifySignedMessage } from "../lib/crypto";

const wsHandlers = new Hono<Env>();

/* Subscribe quotes - WS / */
const quoteReceivedJsonMessageSchema = z.discriminatedUnion("type", [
  quoteExactAmountInSchema.extend({
    exactAmountIn: z.bigint().transform(String),
  }),
  quoteExactAmountOutSchema.extend({
    exactAmountOut: z.bigint().transform(String),
  }),
]);

const sendQuoteOfferJsonMessageSchema = z.discriminatedUnion("type", [
  quoteOfferExactAmountInSchema
    .extend({
      amountOut: z.coerce.bigint(),
      signedMessage: z.object({
        publicKey: byteArrayToBytes,
        message: byteArrayToBytes,
        signature: byteArrayToBytes,
      }),
    })
    .omit({ id: true }),
  quoteOfferExactAmountOutSchema
    .extend({
      amountIn: z.coerce.bigint(),
      signedMessage: z.object({
        publicKey: byteArrayToBytes,
        message: byteArrayToBytes,
        signature: byteArrayToBytes,
      }),
    })
    .omit({ id: true }),
]);

wsHandlers.all("/", (c, next) => {
  const redis = c.get("REDIS");
  const redisSubscriber = c.get("REDIS_SUBSCRIBER");

  return upgradeWebSocket(() => {
    return {
      onOpen: (_e, ws) => {
        redisSubscriber.subscribe("quotes", async (msg) => {
          const quote = quoteStore.decode(msg);
          const quoteJson = quoteReceivedJsonMessageSchema.parse(quote);

          ws.send(JSON.stringify(quoteJson));
        });
      },
      onMessage: async (evt) => {
        const signedQuoteOffer = (() => {
          try {
            const parsedMessage = JSON.parse(evt.data.toString());
            const quoteOffer = sendQuoteOfferJsonMessageSchema.parse(parsedMessage);

            return quoteOffer;
          } catch {
            return null;
          }
        })();
        if (!signedQuoteOffer) return;

        const storedQuote = await redis.get(`quote:${signedQuoteOffer.quoteId}`);
        if (!storedQuote) return;

        const quote = quoteStore.decode(storedQuote);

        const solverIntentPayload = intentPayloadStruct.parse(signedQuoteOffer.signedMessage.message);

        if (quote.assetIn !== solverIntentPayload.asset_out) return;
        if (quote.assetOut !== solverIntentPayload.asset_in) return;

        switch (quote.type) {
          case "exactAmountIn":
            if (quote.exactAmountIn !== BigInt(solverIntentPayload.amount_out)) return;
            break;
          case "exactAmountOut":
            if (quote.exactAmountOut !== BigInt(solverIntentPayload.amount_in)) return;
            break;
          default:
            return;
        }

        const algorithm = getAlgorithmName(solverIntentPayload.algorithm);
        if (!algorithm) return;

        const isValidSignedMessage = verifySignedMessage(algorithm, signedQuoteOffer.signedMessage);
        if (!isValidSignedMessage) return;

        const quoteOfferId = v4();
        const quoteOffer = quoteOfferStore.encode({
          id: quoteOfferId,
          ...signedQuoteOffer,
        });

        const ttlSeconds = Math.ceil((signedQuoteOffer.deadline - Date.now()) / 1000);
        await Promise.all([
          redis.setex(`quote-offer:${quoteOfferId}`, ttlSeconds, quoteOffer),
          redis.lpush(`quote:${signedQuoteOffer.quoteId}:offers`, quoteOfferId),
        ]);
      },
      onClose: () => {
        redisSubscriber.unsubscribe("quotes");
      },
    };
  })(c, next);
});

export { wsHandlers };
