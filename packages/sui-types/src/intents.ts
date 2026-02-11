import { bcs } from "@mysten/sui/bcs";

import type { Algorithm } from "@suintents/core";

export const intentPayloadStruct = bcs.struct("IntentPayload", {
  algorithm: bcs.u8(),
  nonce: bcs.vector(bcs.u8()),
  asset_in: bcs.string(),
  amount_in: bcs.u256(),
  asset_out: bcs.string(),
  amount_out: bcs.u256(),
  deadline: bcs.u64(),
});

export const signedMessageStruct = bcs.struct("SignedMessage", {
  payload: intentPayloadStruct,
  signature: bcs.vector(bcs.u8()),
  public_key: bcs.vector(bcs.u8()),
});

export const algorithmMapping = {
  1: "ed25519",
} as const satisfies Record<number, Algorithm>;

export const getAlgorithmName = (algorithm: number): Algorithm | null => {
  return algorithmMapping[algorithm as keyof typeof algorithmMapping] ?? null;
};
