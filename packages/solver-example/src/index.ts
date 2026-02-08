import { bcs } from "@mysten/sui/bcs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import WebSocket from "ws";

import { quoteReceivedJsonSchema, submitQuoteOutputJsonSchema } from "./types/quote";

const intentPayloadStruct = bcs.struct("IntentPayload", {
  nonce: bcs.vector(bcs.u8()),
  asset_in: bcs.string(),
  amount_in: bcs.u256(),
  asset_out: bcs.string(),
  amount_out: bcs.u256(),
  deadline: bcs.u64(),
});

const signedMessageStruct = bcs.struct("SignedIntent", {
  algorithm: bcs.u8(),
  payload: intentPayloadStruct,
  signature: bcs.vector(bcs.u8()),
  public_key: bcs.vector(bcs.u8()),
});

const solverPrivateKey = Bun.env.PRIVATE_KEY!;
const solverKeypair = Ed25519Keypair.fromSecretKey(solverPrivateKey);

const ws = new WebSocket("ws://localhost:3000/ws");

ws.on("message", async (data) => {
  const message = JSON.parse(data.toString());

  console.log(message);

  const quoteValidation = quoteReceivedJsonSchema.safeParse(message);
  if (!quoteValidation.success) return;

  const quote = quoteValidation.data;

  const nonce = Uint8Array.from(Date.now().toString());
  const deadline = Date.now() + 1000 * 60;

  const amountOut = 1000n;

  const payload = intentPayloadStruct.serialize({
    asset_in: quote.assetOut,
    amount_in: amountOut,
    asset_out: quote.assetIn,
    amount_out: quote.exactAmountIn,
    deadline,
    nonce,
  });

  const signature = await solverKeypair.sign(payload.toBytes());

  const quoteSubmit = submitQuoteOutputJsonSchema.parse({
    quoteId: quote.id,

    nonce: Array.from(nonce),
    assetIn: quote.assetOut,
    amountIn: amountOut.toString(),
    assetOut: quote.assetIn,
    amountOut: quote.exactAmountIn.toString(),
    deadline,

    algorithm: 1,
    publicKey: Array.from(solverKeypair.getPublicKey().toRawBytes()),
    signature: Array.from(signature),
  });

  console.log("Submitting a quote output");
  ws.send(JSON.stringify(quoteSubmit));
  console.log("Quote output submitted");
});

// const intentPayload1 = {
//   nonce: Uint8Array.from(Date.now().toString()),
//   asset_in: "sui:mainnet:sui",
//   asset_out: "evm:8453:usdc",
//   amount_in: 1000n,
//   amount_out: 100n,
//   deadline: Date.now() + 1000 * 60 * 5,
// };

// const intentPayload1Bcs = intentPayloadStruct.serialize(intentPayload1);

// const intentPayload1Signature = await sui1Keypair.sign(intentPayload1Bcs.toBytes());

// const singedIntent1 = signedMessageStruct.serialize({
//   algorithm: 1,
//   payload: intentPayload1,
//   signature: intentPayload1Signature,
//   public_key: sui1PublicKey.toRawBytes(),
// });
