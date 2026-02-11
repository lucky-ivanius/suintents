/// Module: suintents
/// Core module for P2P swap intents with multi-signature verification
#[allow(unused_use)]
module suintents::suintents;

use sui::table::{Self, Table};
use sui::ed25519;
use sui::event;
use sui::clock::{Self, Clock};
use sui::bcs::{Self, BCS};
use std::string::{Self, String};

const EAccountNotFound: u64 = 2;
const EInsufficientBalance: u64 = 3;
const EZeroAmount: u64 = 4;
const EInvalidSignature: u64 = 5;
const EInvalidNonce: u64 = 6;
const EInvalidAsset: u64 = 7;
const EIntentExpired: u64 = 8;
const EInvalidIntentMatching: u64 = 9;
const ESelfTrade: u64 = 10;

const ALGORITHM_ED25519: u8 = 1;

// Events
public struct AccountDeposited has copy, drop {
    public_key: vector<u8>,
    asset: String,
    amount: u256,
    timestamp: u64
}

public struct WithdrawRequested has copy, drop {
    public_key: vector<u8>,
    asset: String,
    amount: u256,
    timestamp: u64
}

public struct ExecutedIntent has copy, drop {
    public_key: vector<u8>,
    asset_in: String,
    amount_in: u256,
    asset_out: String,
    amount_out: u256
}

public struct IntentExecuted has copy, drop {
    executed_intent_a: ExecutedIntent,
    executed_intent_b: ExecutedIntent,

    timestamp: u64
}

public struct State has key {
    id: UID,
    admin: address,
    accounts: Table<vector<u8>, Account>,
    used_nonces: Table<vector<u8>, bool>,
}

public struct Account has store {
    balances: Table<String, u256>,
    created_at: u64,
}

public struct IntentPayload has drop, copy {
  algorithm: u8,
  nonce: vector<u8>,
  asset_in: String,
  amount_in: u256,
  asset_out: String,
  amount_out: u256,
  deadline: u64,
}

public struct SignedIntent has drop, copy {
  payload: IntentPayload,
  signature: vector<u8>,
  public_key: vector<u8>,
}

public struct AdminCap has key, store {
    id: UID,
}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    let state = State {
        id: object::new(ctx),
        admin: ctx.sender(),
        accounts: table::new(ctx),
        used_nonces: table::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
    transfer::share_object(state);
}

entry fun deposit(
    state: &mut State,
    _admin_cap: &AdminCap,
    public_key: vector<u8>,
    asset: String,
    amount: u256,
    ctx: &mut TxContext,
) {
    assert!(amount > 0, EZeroAmount);

    // Lazy creation
    if (!state.accounts.contains(public_key)) {
        let account = Account {
            balances: table::new(ctx),
            created_at: ctx.epoch_timestamp_ms(),
        };
        state.accounts.add(public_key, account);
    };

    let account = state.accounts.borrow_mut(public_key);
    if (!account.balances.contains(asset)) {
        account.balances.add(asset, amount);
    } else {
        let balance = account.balances.borrow_mut(asset);
        *balance = *balance + amount;
    };

    event::emit(AccountDeposited {
        public_key,
        asset,
        amount,
        timestamp: ctx.epoch_timestamp_ms()
    });
}

entry fun withdraw(
    state: &mut State,
    _admin_cap: &AdminCap,
    public_key: vector<u8>,
    asset: String,
    amount: u256,
    ctx: &TxContext,
) {
    assert!(amount > 0, EZeroAmount);
    let account = state.accounts.borrow_mut(public_key);
    assert!(account.balances.contains(asset), EAccountNotFound);
    let balance = account.balances.borrow_mut(asset);
    assert!(*balance >= amount, EInsufficientBalance);
    *balance = *balance - amount;

    event::emit(WithdrawRequested {
        public_key,
        asset,
        amount,
        timestamp: ctx.epoch_timestamp_ms()
    });
}

entry fun execute_intents(
    state: &mut State,
    signed_intent_a: vector<u8>,
    signed_intent_b: vector<u8>,
    clock: &Clock,
    _ctx: &mut TxContext,
) {
    let intent_a = deserialize_signed_intent(signed_intent_a);
    validate_signed_intent(state, &intent_a, clock);

    let intent_b = deserialize_signed_intent(signed_intent_b);
    validate_signed_intent(state, &intent_b, clock);

    assert!(intent_a.public_key != intent_b.public_key, ESelfTrade);
    assert!(intent_a.payload.nonce != intent_b.payload.nonce, EInvalidNonce);

    validate_matching_intents(&intent_a.payload, &intent_b.payload);

    // Swap assets
    state.transfer(intent_a.public_key, intent_b.public_key, intent_a.payload.asset_in, intent_a.payload.amount_in);
    state.transfer(intent_b.public_key, intent_a.public_key, intent_b.payload.asset_in, intent_b.payload.amount_in);

    // Mark nonces as used
    state.used_nonces.add(intent_a.payload.nonce, true);
    state.used_nonces.add(intent_b.payload.nonce, true);

    event::emit(IntentExecuted {
        executed_intent_a: ExecutedIntent {
          public_key: intent_a.public_key,
          asset_in: intent_a.payload.asset_in,
          amount_in: intent_a.payload.amount_in,
          asset_out: intent_a.payload.asset_out,
          amount_out: intent_a.payload.amount_out,
        },

        executed_intent_b: ExecutedIntent {
          public_key: intent_b.public_key,
          asset_in: intent_b.payload.asset_in,
          amount_in: intent_b.payload.amount_in,
          asset_out: intent_b.payload.asset_out,
          amount_out: intent_b.payload.amount_out,
        },

        timestamp: clock.timestamp_ms(),
    });
}

fun transfer(
    state: &mut State,
    from: vector<u8>,
    to: vector<u8>,
    asset: String,
    amount: u256,
) {
    // Debit
    {
        assert!(state.accounts.contains(from), EAccountNotFound);
        let account = state.accounts.borrow_mut(from);
        assert!(account.balances.contains(asset), EInsufficientBalance);
        let balance = account.balances.borrow_mut(asset);
        assert!(*balance >= amount, EInsufficientBalance);
        *balance = *balance - amount;
    };

    // Credit
    {
        assert!(state.accounts.contains(to), EAccountNotFound);
        let account = state.accounts.borrow_mut(to);
        if (!account.balances.contains(asset)) {
            account.balances.add(asset, amount);
        } else {
            let balance = account.balances.borrow_mut(asset);
            *balance = *balance + amount;
        }
    }
}

fun validate_matching_intents(payload_a: &IntentPayload, payload_b: &IntentPayload) {
    assert!(
        payload_a.asset_in == payload_b.asset_out &&
        payload_a.amount_in == payload_b.amount_out &&
        payload_a.asset_out == payload_b.asset_in &&
        payload_a.amount_out == payload_b.amount_in,
        EInvalidIntentMatching
    );
}

fun validate_intent_payload(state: &State, intent_payload: &IntentPayload, clock: &Clock) {
    // Validate deadline
    assert!(clock.timestamp_ms() <= intent_payload.deadline, EIntentExpired);

    // Validate assets
    assert!(intent_payload.asset_in != intent_payload.asset_out, EInvalidAsset);

    // Validate amount
    assert!(intent_payload.amount_in > 0, EZeroAmount);
    assert!(intent_payload.amount_out > 0, EZeroAmount);

    // Validate and track nonce
    assert!(!state.used_nonces.contains(intent_payload.nonce), EInvalidNonce);
}

fun validate_signed_intent(state: &State, signed_intent: &SignedIntent, clock: &Clock) {
    validate_intent_payload(state, &signed_intent.payload, clock);

    let intent_payload_bytes = bcs::to_bytes(&signed_intent.payload);

    let valid = match (signed_intent.payload.algorithm) {
      ALGORITHM_ED25519 => ed25519::ed25519_verify(&signed_intent.signature, &signed_intent.public_key, &intent_payload_bytes),
        _ => false
    };

    assert!(valid, EInvalidSignature);
}

fun deserialize_signed_intent(bytes: vector<u8>): SignedIntent {
    let mut bcs = bcs::new(bytes);

    // Deserialize IntentPayload fields
    let algorithm = bcs.peel_u8();
    let nonce = bcs.peel_vec_u8();
    let asset_in = bcs.peel_vec_u8().to_string();
    let amount_in = bcs.peel_u256();
    let asset_out = bcs.peel_vec_u8().to_string();
    let amount_out = bcs.peel_u256();
    let deadline = bcs.peel_u64();

    let payload = IntentPayload {
        algorithm,
        nonce,
        asset_in,
        amount_in,
        asset_out,
        amount_out,
        deadline,
    };

    let signature = bcs.peel_vec_u8();
    let public_key = bcs.peel_vec_u8();

    SignedIntent {
        payload,
        signature,
        public_key,
    }
}
