import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";

import type { Bytes } from "../core/bytes";
import type { Algorithm, SignedMessage } from "../core/signature";

export const verifyEd25519 = (publicKey: Bytes, signature: Bytes, payload: Bytes) => {
  const ed25519PublicKey = new Ed25519PublicKey(publicKey);

  return ed25519PublicKey.verify(payload, signature);
};

export const verifySignedMessage = (algorithm: Algorithm, signedMessage: SignedMessage) => {
  switch (algorithm) {
    case "ed25519":
      return verifyEd25519(signedMessage.publicKey, signedMessage.signature, signedMessage.message);
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
};
