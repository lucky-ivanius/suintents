import { bcs } from "@mysten/sui/bcs";

import type { SignedMessage } from "../core/signature";
import { envVars } from "../env";

export const suintentsPackageId = envVars.SUINTENTS_PACKAGE_ID;
export const suintentsModule = envVars.SUINTENTS_MODULE;
export const suintentsStateObjectId = envVars.SUINTENTS_STATE_OBJECT_ID;
export const suintentsAdminCapObjectId = envVars.SUINTENTS_ADMIN_CAP_OBJECT_ID;

export const suintentsIntentPayloadStruct = bcs.struct("IntentPayload", {
  algorithm: bcs.u8(),
  nonce: bcs.vector(bcs.u8()),
  asset_in: bcs.string(),
  amount_in: bcs.u256(),
  asset_out: bcs.string(),
  amount_out: bcs.u256(),
  deadline: bcs.u64(),
});

export const suintentsSignedMessageStruct = bcs.struct("SignedMessage", {
  payload: suintentsIntentPayloadStruct,
  signature: bcs.vector(bcs.u8()),
  public_key: bcs.vector(bcs.u8()),
});

export const suintentsAlgorithmMapping = {
  1: "ed25519",
} as const;

export type SuintentsAlgorithm = keyof typeof suintentsAlgorithmMapping;

export const getSuintentsAlgorithmName = (algorithm: SuintentsAlgorithm) => {
  return suintentsAlgorithmMapping[algorithm];
};

export const toSuintentsSignedMessage = (signedMessage: SignedMessage) => {
  const intentPayload = suintentsIntentPayloadStruct.parse(signedMessage.message);

  return suintentsSignedMessageStruct
    .serialize({
      payload: intentPayload,
      public_key: signedMessage.publicKey,
      signature: signedMessage.signature,
    })
    .toBytes();
};
