import { z } from "zod";

export const bytes = z.instanceof(Uint8Array);
export type Bytes = z.infer<typeof bytes>;

export const byteArray = z.array(z.uint32().min(0).max(255));
export type ByteArray = z.infer<typeof byteArray>;

export const byteArrayToBytes = z.codec(byteArray, z.instanceof(Uint8Array), {
  decode: (data) => Uint8Array.from(data),
  encode: (bytes) => Array.from(bytes),
});

export const bytesToByteArray = z.codec(z.instanceof(Uint8Array), byteArray, {
  decode: (data) => Array.from(data),
  encode: (bytes) => Uint8Array.from(bytes),
});
