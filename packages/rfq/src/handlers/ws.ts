import { deserialize, serialize } from "node:v8";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { verifySignature } from "@mysten/sui/verify";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { v4 } from "uuid";

import type { Env } from "../env";
import type { Quote, QuoteOutput } from "../types/quote";
import { intentPayloadStruct } from "../lib/suintents/structs";
import { submitQuoteOutputJsonSchema } from "../types/quote";

const wsHandlers = new Hono<Env>();

wsHandlers.use((c, next) =>
  upgradeWebSocket(() => {
    const redis = c.get("REDIS");
    const redisSubscriber = c.get("REDIS_SUBSRIBER");

    return {
      onMessage: async (msg, ws) => {
        const submittedQuote = (() => {
          try {
            const parsedMessage = JSON.parse(msg.data.toString());

            return submitQuoteOutputJsonSchema.parse(parsedMessage);
          } catch {
            return null;
          }
        })();
        if (!submittedQuote)
          return ws.send(
            JSON.stringify({
              error: "bad_request",
            })
          );

        const serializedQuote = await redis.get(`quote:${submittedQuote.quoteId}`);
        if (!serializedQuote)
          return ws.send(
            JSON.stringify({
              error: "invalid_quote",
            })
          );
        const quoteBytes = Uint8Array.fromBase64(serializedQuote);

        const quote = deserialize(quoteBytes) as Quote;

        if (quote.assetIn !== submittedQuote.assetOut || quote.assetOut !== submittedQuote.assetIn || quote.exactAmountIn !== submittedQuote.amountOut)
          return ws.send(
            JSON.stringify({
              error: "invalid_quote_output",
            })
          );

        const serializedIntentPayload = intentPayloadStruct.serialize({
          nonce: submittedQuote.nonce,
          asset_in: submittedQuote.assetIn,
          amount_in: submittedQuote.amountIn,
          asset_out: submittedQuote.assetOut,
          amount_out: submittedQuote.amountOut,
          deadline: submittedQuote.deadline,
        });

        if (submittedQuote.algorithm === 1) {
          const ed25519PublicKey = new Ed25519PublicKey(submittedQuote.publicKey);

          const valid = await ed25519PublicKey.verify(serializedIntentPayload.toBytes(), Uint8Array.from(submittedQuote.signature));
          if (!valid) return ws.send(JSON.stringify({ error: "invalid_signature" }));
        }

        const quoteOutputId = v4();
        const quoteOutput: QuoteOutput = {
          id: quoteOutputId,
          publicKey: submittedQuote.publicKey,
          quoteId: submittedQuote.quoteId,
          amountOut: submittedQuote.amountIn,
          deadline: submittedQuote.deadline,
        };

        await redis.set(`quote-output:${quoteOutputId}`, serialize(quoteOutput).toBase64());
        await redis.lpush(`quote-outputs:${submittedQuote.quoteId}`, quoteOutputId);
      },
      onOpen: (_e, ws) => {
        redisSubscriber.subscribe("quote", (d) => {
          const quoteBytes = Uint8Array.fromBase64(d);

          const quote = deserialize(quoteBytes) as Quote;

          ws.send(JSON.stringify({ ...quote, exactAmountIn: quote.exactAmountIn.toString() }));
        });
      },
    };
  })(c, next)
);

export { wsHandlers };
