import { deserialize, serialize } from "node:v8";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v4 } from "uuid";

import type { Env } from "../env";
import type { GetQuoteJsonOutput, Quote, QuoteOutput } from "../types/quote";
import { getQuoteJsonInputSchema } from "../types/quote";

const quoteHandlers = new Hono<Env>();

quoteHandlers.post("/", zValidator("json", getQuoteJsonInputSchema), async (c) => {
  const body = c.req.valid("json");

  const redis = c.get("REDIS");
  const redisPublisher = c.get("REDIS_PUBLISHER");

  const quoteId = v4();
  const quote: Quote = {
    id: quoteId,
    ...body,
    createdAt: Date.now(),
  };
  const serializedQuote = serialize(quote).toBase64();

  await Promise.all([redis.set(`quote:${quoteId}`, serializedQuote), redisPublisher.publish("quote", serializedQuote)]);

  await Bun.sleep(3000);

  const serializedOutputIds = await redis.lrange(`quote-outputs:${quoteId}`, 0, -1);
  const serializedOutputs = await redis.mget(...serializedOutputIds.map((id) => `quote-output:${id}`));
  const outputs = serializedOutputs
    .filter(Boolean)
    .map((s) => {
      const outputBytes = Uint8Array.fromBase64(s!);

      const { quoteId, ...output } = deserialize(outputBytes) as QuoteOutput;

      return { ...output, amountOut: output.amountOut.toString() };
    })
    .filter((o) => o.deadline >= quote.createdAt + quote.minDeadlineMs);

  return c.json<GetQuoteJsonOutput, 200>(
    {
      quote: {
        ...quote,
        exactAmountIn: quote.exactAmountIn.toString(),
      },
      outputs,
    },
    200
  );
});
// .post("/publish", zValidator("json"), async (c) => {});

export { quoteHandlers };
