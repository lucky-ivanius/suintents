# suintents

**Intent-based cross-chain swap protocol built on Sui, powered by Ika Network**

---

## Overview

suintents lets you swap assets across Bitcoin, Ethereum, Solana, Sui, and more—without bridges or wrapped tokens. Connect your existing wallet (MetaMask, Phantom, Slush, or Passkeys), express what you want, and let market makers compete to give you the best deal.

Inspired by [Near Intents](https://near.org/intents), built natively on Sui.

## How It Works

```
1. Connect Wallet    →  dWallet created via Ika's Distributed Key Generation
2. Deposit           →  Send to your unique address, balance credited on Sui
3. Quote             →  Request quote from solvers
3. Solvers Compete   →  Market makers bid, best quote wins
4. Submit Intent     →  "I want to swap 100 USDC for 0.1 SOL"
5. Instant Swap      →  Single Sui transaction (atomic)
6. Withdraw Anytime  →  Ika signs tx to your destination on any chain
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│    MetaMask  •  Phantom  •  Slush  •  Passkeys              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    OFF-CHAIN SERVICES                        │
│         Quote Engine  •  Solver Network  •  Relayer          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   SUI SMART CONTRACT                         │
│    Balance Tracking  •  Atomic Swaps  •  Withdrawals        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      IKA NETWORK                             │
│           dWallets  •  2PC-MPC Signatures  •  DKG           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   EXTERNAL CHAINS                            │
│       Bitcoin  •  Ethereum  •  Solana  •  Base  •  ...      │
└─────────────────────────────────────────────────────────────┘
```

## How Ika Powers suintents

[Ika](https://ika.xyz) is a Zero-Trust threshold signature network implementing 2PC-MPC, ensuring users are cryptographically required to participate in signature generation.

- **dWallets**: Every user gets a dWallet—a programmable wallet that can hold and sign transactions on any chain
- **Sub-Second Signing**: 10,000+ signatures/second across hundreds of nodes
- **Contract-Controlled**: Sui smart contracts can authorize cross-chain transactions

With dWallets, native assets on any chain can be directly accessed and coordinated by Sui smart contracts.

## License

MIT
