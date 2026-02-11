import type { Context, Env, Input } from "hono";
import type { z } from "zod";

import { badRequest } from "./response";

export const fromSchema =
  <TSchema extends z.ZodType>(schema: TSchema) =>
  <TValue, TEnv extends Env, TPath extends string, TInput extends Input>(value: TValue, c: Context<TEnv, TPath, TInput>) => {
    const result = schema.safeParse(value);

    if (!result.success) {
      const [error] = result.error.issues;

      if (error?.code === "invalid_union") {
        const [unionErrors] = error.errors ?? [];
        const [unionError] = unionErrors ?? [];

        return badRequest(c, {
          code: "invalid_request",
          message: unionError ? unionError.message : "Invalid request",
        });
      }

      return badRequest(c, {
        code: "invalid_request",
        message: error ? error.message : "Invalid request",
      });
    }

    return result.data;
  };
