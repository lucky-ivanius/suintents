import { RedisClient } from "bun";
import { Hono } from "hono";
import { websocket } from "hono/bun";
import { logger } from "hono/logger";

import type { Env } from "./env";
import { quoteHandlers } from "./handlers/quote";
import { wsHandlers } from "./handlers/ws";

const app = new Hono<Env>();

const redis = new RedisClient();
const redisPublisher = new RedisClient();
const redisSubscriber = new RedisClient();

await redis.connect();
await redisPublisher.connect();
await redisSubscriber.connect();

app.use(logger()).use((c, next) => {
  c.set("REDIS", redis);
  c.set("REDIS_PUBLISHER", redisPublisher);
  c.set("REDIS_SUBSRIBER", redisSubscriber);

  return next();
});

app.route("/quotes", quoteHandlers).route("/ws", wsHandlers);

export default {
  fetch: app.fetch,
  websocket,
};
