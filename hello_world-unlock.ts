import {
    Blockfrost,
    C,
    Constr,
    Data,
    Lucid,
    SpendingValidator,
    TxHash,
    fromHex,
    toHex,
    utf8ToHex,
  } from "https://deno.land/x/lucid@0.8.3/mod.ts";
  import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";
   
  const lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-preview.blockfrost.io/api/v0",
      "previewxplsRlSK9N2QlfSsZ9wl3yib3inYGCxu",
    ),
    "Preview",
  );
   
  lucid.selectWalletFromPrivateKey(await Deno.readTextFile("./key.sk"));
   
  const validator = await readValidator("./assets/hello_world/spend/script.cbor");
   
  // --- Supporting functions
   
  async function readValidator(filepath: String): Promise<SpendingValidator> {
    return {
      type: "PlutusV2",
      script: toHex(cbor.encode(fromHex(await Deno.readTextFile(filepath)))),
    };
  }

  // ^^^ Code above is unchanged unchanged. ^^^
 
const utxo = { txHash: "cdc742dbd09db6937739488b48fab11bf56df3da7bcbf71396bda6fb44cc7800", outputIndex: 0 };
 
const redeemer = Data.to(new Constr(0, [utf8ToHex("Hello, World!")]));
 
const txUnlock = await unlock(utxo, { from: validator, using: redeemer });
 
await lucid.awaitTx(txUnlock);
 
console.log(`1 ADA recovered from the contract
    Tx ID: ${txUnlock}
    Redeemer: ${redeemer}
`);
 
// --- Supporting functions
 
async function unlock(ref, { from, using }): Promise<TxHash> {
  const [utxo] = await lucid.utxosByOutRef([ref]);
 
  const tx = await lucid
    .newTx()
    .collectFrom([utxo], using)
    .addSigner(await lucid.wallet.address())
    .attachSpendingValidator(from)
    .complete();
 
  const signedTx = await tx
    .sign()
    .complete();
 
  return signedTx.submit();
}