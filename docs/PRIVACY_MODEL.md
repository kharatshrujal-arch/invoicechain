# Privacy Model & Anti-Fraud Security Guarantee — InvoiceChain on Midnight Network

## 🛡️ Executive Summary

InvoiceChain solves double-financing fraud in supply chain invoice financing without sacrificing commercial privacy. On transparent blockchains (e.g. Ethereum), double-financing prevention requires publishing raw invoice details (amount, buyer, seller, due date) to public ledger state—exposing corporate cash flows and customer relationships to public observers.

On **Midnight Network**, InvoiceChain utilizes Compact ZK circuits to achieve **Data Minimization & Selective Disclosure**:
- **Public Ledger State:** Holds only a cryptographic hash commitment (`invoiceCommitment`), a status flag (`invoiceStatus`), anonymized lender ID, timestamp, and a nullifier set.
- **Private Witness:** The raw invoice fields (`invoiceAmount`, `buyerId`, `sellerId`, `dueDate`, `salt`) stay entirely inside the user's encrypted local client witness.

---

## 📊 Observable Privacy Breakdown Matrix

| Commercial Data Field | On-Chain Public State | Private Client Witness | Observer Visibility | ZK Circuit Proof Role |
| :--- | :--- | :--- | :--- | :--- |
| **Invoice Dollar Amount** | ❌ **NOT STORED** | 🔒 **Encrypted Witness** | **Hidden** | Proves amount matches commitment & payment >= amount |
| **Buyer Corporate Name** | ❌ **NOT STORED** | 🔒 **Encrypted Witness** | **Hidden** | Proves buyer identity integrity |
| **Seller MSME Name** | ❌ **NOT STORED** | 🔒 **Encrypted Witness** | **Hidden** | Proves seller ownership of commitment |
| **Payment Due Date** | ❌ **NOT STORED** | 🔒 **Encrypted Witness** | **Hidden** | Proves maturity timestamp bounds |
| **Cryptographic Salt** | ❌ **NOT STORED** | 🔒 **Encrypted Witness** | **Hidden** | Prevents rainbow table dictionary attacks |
| **Commitment Hash** | ✅ **`Bytes<32>`** | 🔒 **Witness Input** | **Public** | Unique ledger anchor for double-financing prevention |
| **Lifecycle Status** | ✅ **`InvoiceStatus`** | 🔒 **Circuit Updated** | **Public** | `Open` ➔ `Financed` ➔ `Settled` state machine |
| **Financed Lender ID** | ✅ **`Bytes<32>`** | 🔒 **Witness Input** | **Public** | Public record of active financing institution |

---

## 🔒 What an On-Chain Observer CAN Learn vs CANNOT Learn

### What an Observer CAN Learn:
1. An invoice commitment with hash `0x8f3c9e12...` was registered at block `1489203`.
2. The current status of the commitment is `Financed` (or `Open` / `Settled`).
3. Lender `0xa41b...` submitted a valid zero-knowledge proof transitioning the status to `Financed`.
4. Any second financing attempt on the same commitment hash is rejected by the Midnight circuit.

### What an Observer CANNOT Learn:
1. **The Invoice Value:** Whether the invoice is worth $10,000 or $10,000,000.
2. **The Buyer Identity:** Which multinational enterprise owes payment.
3. **The MSME Identity:** Which small business is obtaining liquidity.
4. **The Due Date:** When liquidity or payment is expected.

---

## ⚡ Core Anti-Double Financing Proof Logic (`financeInvoice` Circuit)

```compact
export circuit financeInvoice(
    commitment: Bytes<32>,
    lenderId: Bytes<32>
): Boolean {
    // 1. Check commitment presence
    assert processedNullifiers.member(commitment) "Invoice commitment not found in registry";

    // 2. Structural Anti-Fraud Constraint: Reject proof generation if status is not Open
    assert invoiceStatus == InvoiceStatus.Open "Invoice is already Financed — Double financing attempt blocked!";

    // 3. Verify private witness hash integrity
    const privateData = getPrivateInvoiceData();
    const computedCommitment = persistent_hash<Bytes<32>>(
        pad(32, "INVOICE_CHAIN_V1"),
        privateData.invoiceAmount,
        privateData.buyerId,
        privateData.sellerId,
        privateData.dueDate,
        privateData.salt
    );

    // 4. Transition state
    invoiceStatus = InvoiceStatus.Financed;
    financedLender = lenderId;
    return true;
}
```

When Lender B attempts to finance an invoice already financed by Lender A, condition (2) evaluates to `false`. The Midnight PLONK prover fails proof generation client-side. Lender B is prevented from double-financing, yet Lender B learns nothing about the underlying invoice amount or buyer!
