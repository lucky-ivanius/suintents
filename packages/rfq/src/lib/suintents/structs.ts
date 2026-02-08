import { bcs } from "@mysten/sui/bcs";

export const intentPayloadStruct = bcs.struct("IntentPayload", {
  nonce: bcs.vector(bcs.u8()),
  asset_in: bcs.string(),
  amount_in: bcs.u256(),
  asset_out: bcs.string(),
  amount_out: bcs.u256(),
  deadline: bcs.u64(),
});

export const signedMessageStruct = bcs.struct("SignedIntent", {
  algorithm: bcs.u8(),
  payload: intentPayloadStruct,
  signature: bcs.vector(bcs.u8()),
  public_key: bcs.vector(bcs.u8()),
});
