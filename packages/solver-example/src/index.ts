import { bcs } from "@mysten/sui/bcs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import WebSocket from "ws";

const intentPayloadStruct = bcs.struct("IntentPayload", {
  algorithm: bcs.u8(),
  nonce: bcs.vector(bcs.u8()),
  asset_in: bcs.string(),
  amount_in: bcs.u256(),
  asset_out: bcs.string(),
  amount_out: bcs.u256(),
  deadline: bcs.u64(),
});

const solverPrivateKey = Bun.env.PRIVATE_KEY!;
const solverKeypair = Ed25519Keypair.fromSecretKey(solverPrivateKey);

const ws = new WebSocket("ws://localhost:8080/ws");

ws.on("message", async (data) => {
  const quote = JSON.parse(data.toString());

  const nonce = Uint8Array.from(Date.now().toString());
  const deadline = Date.now() + 1000 * 60;

  const amountOut = 1000000n;

  const payload = intentPayloadStruct.serialize({
    algorithm: 1,
    asset_in: quote.assetOut,
    amount_in: amountOut,
    asset_out: quote.assetIn,
    amount_out: BigInt(quote.exactAmountIn),
    deadline,
    nonce,
  });

  const signature = await solverKeypair.sign(payload.toBytes());

  const quoteOffer = {
    type: "exactAmountIn",
    amountOut: amountOut.toString(),
    quoteId: quote.id,
    signedMessage: {
      publicKey: Array.from(solverKeypair.getPublicKey().toRawBytes()),
      message: Array.from(payload.toBytes()),
      signature: Array.from(signature),
    },
    deadline,
  };

  // console.log("Submitting a quote output");
  ws.send(JSON.stringify(quoteOffer));
  // console.log("Quote output submitted");
});
