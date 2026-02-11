import type { SignedMessage } from "@suintents/core/signature";
import { intentPayloadStruct, signedMessageStruct } from "@suintents/sui-types";

import { envVars } from "../env";

export const suintentsPackageId = envVars.SUINTENTS_PACKAGE_ID;
export const suintentsModule = envVars.SUINTENTS_MODULE;
export const suintentsStateObjectId = envVars.SUINTENTS_STATE_OBJECT_ID;
export const suintentsAdminCapObjectId = envVars.SUINTENTS_ADMIN_CAP_OBJECT_ID;

export const toSuintentsSignedMessage = (signedMessage: SignedMessage) => {
  const intentPayload = intentPayloadStruct.parse(signedMessage.message);

  return signedMessageStruct
    .serialize({
      payload: intentPayload,
      public_key: signedMessage.publicKey,
      signature: signedMessage.signature,
    })
    .toBytes();
};
