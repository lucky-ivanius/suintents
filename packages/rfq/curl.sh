curl -X POST http://localhost:3000/quotes \
-H "Content-Type: application/json" \
-d '{
  "publicKey": [],
  "assetIn": "sui:mainnet:sui",
  "assetOut": "evm:8453:usdc",
  "exactAmountIn": "1000000000",
  "minDeadlineMs": 60000
}' | jq
