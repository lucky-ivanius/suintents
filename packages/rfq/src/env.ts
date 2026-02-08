import type { RedisClient } from "bun";
import z from "zod";

export const envSchema = z.object({
  REDIS_URL: z.string(),
});

export const env = envSchema.parse(Bun.env);

export type Env = {
  Variables: {
    REDIS: RedisClient;
    REDIS_PUBLISHER: RedisClient;
    REDIS_SUBSRIBER: RedisClient;
  };
};
