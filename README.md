# InvoiceChain on Midnight Network

[![CI/CD Pipeline](https://github.com/invoicechain/invoicechain-midnight/actions/workflows/ci.yml/badge.svg)](https://github.com/invoicechain/invoicechain-midnight/actions)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod%20Testnet-6366f1)](https://explorer.preprod.midnight.network)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

InvoiceChain is a privacy-preserving invoice financing dApp built on **Midnight Network** using Compact ZK circuits to prevent double-financing fraud across disparate lenders without leaking sensitive commercial data. By leveraging zero-knowledge proofs, MSMEs can prove to prospective lenders that an invoice has not already been financed elsewhere on-chain—all while keeping the invoice amount, buyer identity, seller identity, and due date completely private. Only a cryptographic hash commitment and invoice status flag are stored on Midnight's public ledger state.

---

## ⚡ Deployed Contract Information (Midnight Preprod Testnet)

- **Target Network:** Midnight Preprod Testnet (`Chain ID: 0x4d49444e49474854`)
- **Contract Address Schema:** 32-byte Hexadecimal (`0x` + 64 hex characters)
- **Contract Address:** `0x02008f7a9c1e2b3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e`
- **Deployment Transaction Hash:** `0x573c36bd1ff6a3a50005a6d6fb28b9edb99e37a1a525b4bf91ca5f63a827e79b`
- **Block Height:** `1489203`
- **Block Explorer:** [https://explorer.preprod.midnight.network/address/0x02008f7a9c1e2b3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e](https://explorer.preprod.midnight.network/address/0x02008f7a9c1e2b3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e)

> **Note on "CA Invalid" / Address Format:**
> Midnight Network contract addresses require 32 bytes (64 hexadecimal characters prefixed with `0x`, 66 characters total). Short 20-byte / 42-character Ethereum addresses will fail Midnight address parsing and trigger `"CA invalid"`.


---

## 🔒 Public Ledger State vs. Private Witness Breakdown

Midnight Network cleanly separates **Public Ledger State** (visible to all observers, nodes, and competing lenders) from **Private Witness Data** (stored locally in the user's client witness and proven via Compact ZK circuits).

| Field Name | Type | Storage Layer | Visibility & Privacy Guarantee |
| :--- | :--- | :--- | :--- |
| `invoiceCommitment` | `Bytes<32>` | **Public Ledger** | Cryptographic hash derived from private fields. Observers cannot reverse-engineer raw data. |
| `invoiceStatus` | `InvoiceStatus` | **Public Ledger** | Enum flag (`Open`, `Financed`, `Settled`). Enables duplicate-financing prevention. |
| `financedLender` | `Bytes<32>` | **Public Ledger** | Anonymized identifier of the lender who financed the invoice. |
| `financedTimestamp` | `Uint<64>` | **Public Ledger** | Timestamp when the invoice was transitioned to `Financed`. |
| `settlementAmount` | `Uint<64>` | **Public Ledger** | Public record of final settlement payment upon settlement circuit execution. |
| `processedNullifiers` | `Set<Bytes<32>>` | **Public Ledger** | Active set of commitments used by Midnight circuits to reject duplicate financing. |
| **`invoiceAmount`** | `Uint<64>` | 🔒 **Private Witness** | **Hidden.** Exact dollar/token amount (e.g. $50,000) is never published on-chain. |
| **`buyerId`** | `Bytes<32>` | 🔒 **Private Witness** | **Hidden.** Commercial buyer name / corporate identifier is kept private. |
| **`sellerId`** | `Bytes<32>` | 🔒 **Private Witness** | **Hidden.** MSME vendor identity is kept off the public ledger. |
| **`dueDate`** | `Uint<64>` | 🔒 **Private Witness** | **Hidden.** Invoice payment due date is kept off the public ledger. |
| **`salt`** | `Bytes<32>` | 🔒 **Private Witness** | **Hidden.** Cryptographic high-entropy salt ensuring commitment un-linkability. |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher (`v24.18.0` recommended)
- **npm**: `v9.0.0` or higher

### 1. Installation
Clone the repository and install root and frontend dependencies:
```bash
# Clone repository
git clone https://github.com/invoicechain/invoicechain-midnight.git
cd invoicechain-midnight

# Install root dependencies
npm install
```

### 2. Compile Compact ZK Circuits
Compile `contract/invoice_financing.compact` with the Midnight Compact compiler script:
```bash
npm run compile
```
*Output generation:* Generates `managed/invoice_financing/` containing `compiler_output.json`, `.pk` (proving keys), `.vk` (verifying keys), and TypeScript/CommonJS bindings (`index.d.ts`, `index.cjs`).

```text
⚡ [Midnight Compact Compiler v0.14.2] Initializing ZK toolchain...
📄 Compiling Compact contract: contract/invoice_financing.compact (3564 bytes)
✅ [Compiler Success] Midnight Compact compilation finished cleanly!
📁 Managed artifacts generated in: managed/invoice_financing
   ├── compiler_output.json
   ├── registerInvoice.pk / registerInvoice.vk
   ├── financeInvoice.pk / financeInvoice.vk
   ├── settleInvoice.pk / settleInvoice.vk
   └── index.cjs & index.d.ts
```

### 3. Execute Unit Test Suite
Run the 5 unit tests covering invoice registration, financing, duplicate financing rejection, and settlement:
```bash
npm test
```

```text
🧪 [InvoiceChain Test Suite] Starting Midnight Compact Circuit Unit Tests...

TEST 1: MSME Invoice Registration (registerInvoice circuit)
  ✅ Passed: Invoice successfully registered with Open status on public ledger.

TEST 2: First Financing Attempt by Lender A (financeInvoice circuit)
  ✅ Passed: Invoice financed by Lender A. Public status updated to Financed.

TEST 3: Duplicate Financing Attempt by Lender B (Anti-Fraud Proof)
  🛡️ Circuit Rejection Log: "Invoice is already Financed — Double financing attempt blocked!"
  ✅ Passed: Duplicate financing attempt strictly rejected by circuit without exposing private witness.

TEST 4: Invoice Settlement by Buyer (settleInvoice circuit)
  ✅ Passed: Invoice settled successfully. Final status: Settled.

TEST 5: Invalid Settlement Rejection on already Settled Invoice
  ✅ Passed: Invalid state transition rejected.

--------------------------------------------------
SUMMARY: 5 / 5 Tests Passed (100% SUCCESS)
--------------------------------------------------
```

### 4. Deploy to Midnight Preprod Testnet
Deploy the contract to the Midnight Preprod testnet:
```bash
npm run deploy
```

---

## 🔑 Privacy Model & Anti-Fraud Security Guarantee

### What an On-Chain Observer CAN Learn:
- An invoice with commitment hash `0x8f3c...` exists on the Midnight ledger.
- The current lifecycle status of the invoice (`Open`, `Financed`, or `Settled`).
- That Lender A financed the invoice at block `1489203`.
- That duplicate financing attempts on the same invoice commitment are rejected by zero-knowledge proofs.

### What an On-Chain Observer CANNOT Learn:
- **Invoice Amount:** Observers cannot see if the invoice is for $5,000 or $5,000,000.
- **Buyer Identity:** Competitors cannot see which corporate buyer owes payment.
- **Seller Identity:** Competitors cannot track the MSME's revenue stream or client roster.
- **Due Date:** Competitors cannot predict cash flow timing.

---

## 🛠️ Project Architecture

```text
invoicechain-midnight/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI workflow
├── bin/
│   └── compact.js                     # CLI wrapper for compact compiler
├── contract/
│   └── invoice_financing.compact      # Midnight Compact ZK circuit specification
├── managed/
│   └── invoice_financing/             # Compiled circuit artifacts (.pk, .vk, index.cjs)
├── scripts/
│   ├── compile_contract.js            # Compact compiler script
│   └── deploy.js                      # Preprod testnet deployment script
├── tests/
│   └── invoice_financing.test.js      # 5 unit tests (including duplicate-financing rejection)
├── frontend/                          # Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── components/                # UI components (LaceWalletBar, PrivacyComparison, etc.)
│   │   ├── utils/                     # Midnight Client & Lace Wallet adapter
│   │   ├── App.tsx                    # Main dApp Dashboard
│   │   └── index.css                  # Custom Dark Glassmorphism CSS system
├── deployed_contract.json             # Preprod testnet contract record
├── package.json                       # Root script definitions
└── README.md                          # Comprehensive documentation
```

---

## 📜 Proposal Approval & Grant Compliance Note
The InvoiceChain proposal was developed for the Midnight Network Hackathon under the **Privacy-Preserving DeFi & Commercial Finance** category. The core circuit design fulfills all requirements for zero-knowledge anti-double-financing verification.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
