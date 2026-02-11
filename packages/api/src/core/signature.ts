import z from "zod";

import { bytes } from "./bytes";

export const algorithms = ["ed25519"] as const;

export const algorithm = z.enum(algorithms);
export type Algorithm = z.infer<typeof algorithm>;

export const signedMessageSchema = z.object({
  publicKey: bytes,
  message: bytes,
  signature: bytes,
});
export type SignedMessage = z.infer<typeof signedMessageSchema>;
