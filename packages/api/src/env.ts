import type { RedisClient } from "bun";
import type { Keypair } from "@mysten/sui/cryptography";
import type { SuiGrpcClient } from "@mysten/sui/grpc";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { z } from "zod";

export const envVarsSchema = z.object({
  PORT: z.coerce.number().pipe(z.uint32().min(1).max(65535)),

  REDIS_URL: z.url(),

  SUI_NETWORK: z.enum(["devnet", "testnet", "mainnet"]),
  SUI_RPC_URL: z.url(),
  SUI_GRPC_URL: z.url(),

  SUINTENTS_PACKAGE_ID: z.templateLiteral(["0x", z.string()]),
  SUINTENTS_MODULE: z.string(),
  SUINTENTS_STATE_OBJECT_ID: z.templateLiteral(["0x", z.string()]),
  SUINTENTS_ADMIN_CAP_OBJECT_ID: z.templateLiteral(["0x", z.string()]),

  RELAYER_PRIVATE_KEY: z.string(),
});

export const envVars = envVarsSchema.parse(Bun.env);

export type Env = {
  Variables: {
    REDIS: RedisClient;
    REDIS_PUBLISHER: RedisClient;
    REDIS_SUBSCRIBER: RedisClient;

    SUI_JSON_RPC_CLIENT: SuiJsonRpcClient;
    SUI_GRPC_CLIENT: SuiGrpcClient;

    RELAYER_KEYPAIR: Keypair;
  };
};
