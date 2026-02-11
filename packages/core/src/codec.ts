import { deserialize, serialize } from "node:v8";
import { z } from "zod";

import { bytes } from "./bytes";

export const createBytesCodec = <TBytesType extends z.core.SomeType>(dataType: TBytesType) =>
  z.codec(bytes, dataType, {
    encode: (dataType) => serialize(dataType),
    decode: (bytes) => deserialize(bytes),
  });

export const createBase64Codec = <TBytesType extends z.core.SomeType>(dataType: TBytesType) =>
  z.codec(z.base64(), dataType, {
    encode: (dataType) => serialize(dataType).toBase64(),
    decode: (bytes) => deserialize(Uint8Array.fromBase64(bytes)),
  });
