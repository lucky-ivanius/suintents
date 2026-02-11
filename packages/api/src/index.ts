import { RedisClient, serve } from "bun";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Hono } from "hono";
import { websocket } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import type { Env } from "./env";
import { envVars } from "./env";
import { quoteHandlers } from "./handlers/quotes";
import { wsHandlers } from "./handlers/ws";
import { unexpectedError } from "./utils/response";

/* Dependencies */
const redis = new RedisClient(envVars.REDIS_URL);
const redisPublisher = new RedisClient(envVars.REDIS_URL);
const redisSubscriber = new RedisClient(envVars.REDIS_URL);

await redis.connect();
await redisPublisher.connect();
await redisSubscriber.connect();

const suiJsonRpcClient = new SuiJsonRpcClient({ network: "testnet", url: envVars.SUI_RPC_URL });
const suiGrpcClient = new SuiGrpcClient({ network: "testnet", baseUrl: "https://fullnode.testnet.sui.io:443" });
const relayerKeypair = Ed25519Keypair.fromSecretKey(envVars.RELAYER_PRIVATE_KEY);

const app = new Hono<Env>();

/* Middlewares */
app
  .use(logger())
  .use(cors())
  .use((c, next) => {
    c.set("REDIS", redis);
    c.set("REDIS_PUBLISHER", redisPublisher);
    c.set("REDIS_SUBSCRIBER", redisSubscriber);

    c.set("SUI_JSON_RPC_CLIENT", suiJsonRpcClient);
    c.set("SUI_GRPC_CLIENT", suiGrpcClient);

    c.set("RELAYER_KEYPAIR", relayerKeypair);

    return next();
  });

/* Routes */
app.route("/quotes", quoteHandlers).route("/ws", wsHandlers);

/* Error handling */
app.onError((err, c) => {
  console.error(err);

  return unexpectedError(c);
});

/* Server */
const server = serve({
  fetch: app.fetch,
  port: envVars.PORT,
  websocket,
});

process.on("SIGINT", () => {
  server.stop();
  process.exit();
});

process.on("SIGTERM", () => {
  server.stop();
  process.exit();
});
