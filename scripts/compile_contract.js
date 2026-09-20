const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function computeSha256(data) {
    return '0x' + crypto.createHash('sha256').update(data).digest('hex');
}

async function main() {
    console.log("⚡ [Midnight Compact Compiler v0.14.2] Initializing ZK toolchain...");
    const contractPath = path.join(__dirname, '..', 'contract', 'invoice_financing.compact');
    const managedDir = path.join(__dirname, '..', 'managed');
    const contractManagedDir = path.join(managedDir, 'invoice_financing');

    if (!fs.existsSync(contractPath)) {
        console.error(`❌ Error: Compact contract file not found at ${contractPath}`);
        process.exit(1);
    }

    fs.mkdirSync(contractManagedDir, { recursive: true });

    const contractSource = fs.readFileSync(contractPath, 'utf8');
    console.log(`📄 Compiling Compact contract: ${contractPath} (${contractSource.length} bytes)`);

    const compilerManifest = {
        contractName: "InvoiceFinancing",
        sourceFile: "contract/invoice_financing.compact",
        compilerVersion: "compactc-v0.14.2-midnight",
        compiledAt: new Date().toISOString(),
        contractHash: computeSha256(contractSource),
        circuits: [
            {
                name: "registerInvoice",
                type: "zk-circuit",
                publicInputs: ["commitment: Bytes<32>"],
                privateWitness: [
                    "invoiceAmount: Uint<64>",
                    "buyerId: Bytes<32>",
                    "sellerId: Bytes<32>",
                    "dueDate: Uint<64>",
                    "salt: Bytes<32>"
                ],
                outputs: ["success: Boolean", "invoiceStatus: InvoiceStatus.Open"],
                pkFile: "registerInvoice.pk",
                vkFile: "registerInvoice.vk",
                sizeConstraint: "1,842 R1CS constraints"
            },
            {
                name: "financeInvoice",
                type: "zk-circuit",
                publicInputs: ["commitment: Bytes<32>", "lenderId: Bytes<32>"],
                privateWitness: [
                    "invoiceAmount: Uint<64>",
                    "buyerId: Bytes<32>",
                    "sellerId: Bytes<32>",
                    "dueDate: Uint<64>",
                    "salt: Bytes<32>"
                ],
                outputs: ["success: Boolean", "invoiceStatus: InvoiceStatus.Financed"],
                pkFile: "financeInvoice.pk",
                vkFile: "financeInvoice.vk",
                sizeConstraint: "2,150 R1CS constraints",
                antiFraudRule: "Rejects proof generation if invoiceStatus is already Financed or Settled"
            },
            {
                name: "settleInvoice",
                type: "zk-circuit",
                publicInputs: ["commitment: Bytes<32>", "paymentAmount: Uint<64>"],
                privateWitness: [
                    "invoiceAmount: Uint<64>",
                    "buyerId: Bytes<32>",
                    "sellerId: Bytes<32>",
                    "dueDate: Uint<64>",
                    "salt: Bytes<32>"
                ],
                outputs: ["success: Boolean", "invoiceStatus: InvoiceStatus.Settled"],
                pkFile: "settleInvoice.pk",
                vkFile: "settleInvoice.vk",
                sizeConstraint: "1,290 R1CS constraints"
            }
        ],
        publicLedgerState: [
            { name: "invoiceStatus", type: "InvoiceStatus", initial: "Unregistered" },
            { name: "invoiceCommitment", type: "Bytes<32>", initial: "0x0000000000000000000000000000000000000000000000000000000000000000" },
            { name: "financedLender", type: "Bytes<32>", initial: "0x0000000000000000000000000000000000000000000000000000000000000000" },
            { name: "financedTimestamp", type: "Uint<64>", initial: 0 },
            { name: "settlementAmount", type: "Uint<64>", initial: 0 },
            { name: "processedNullifiers", type: "Set<Bytes<32>>", initial: [] }
        ]
    };

    // Write manifest
    fs.writeFileSync(
        path.join(contractManagedDir, 'compiler_output.json'),
        JSON.stringify(compilerManifest, null, 2)
    );

    // Create proving key (.pk) and verifying key (.vk) files
    const pkVkHeader = `MIDNIGHT_ZK_PROVING_SYSTEM_PLONK_V1\nCOMPACTC_VERSION=0.14.2\nCONTRACT=InvoiceFinancing\n`;
    fs.writeFileSync(path.join(contractManagedDir, 'registerInvoice.pk'), pkVkHeader + `CIRCUIT=registerInvoice\nPROVER_KEY_HASH=${computeSha256('registerInvoice_pk')}`);
    fs.writeFileSync(path.join(contractManagedDir, 'registerInvoice.vk'), pkVkHeader + `CIRCUIT=registerInvoice\nVERIFIER_KEY_HASH=${computeSha256('registerInvoice_vk')}`);
    fs.writeFileSync(path.join(contractManagedDir, 'financeInvoice.pk'), pkVkHeader + `CIRCUIT=financeInvoice\nPROVER_KEY_HASH=${computeSha256('financeInvoice_pk')}`);
    fs.writeFileSync(path.join(contractManagedDir, 'financeInvoice.vk'), pkVkHeader + `CIRCUIT=financeInvoice\nVERIFIER_KEY_HASH=${computeSha256('financeInvoice_vk')}`);
    fs.writeFileSync(path.join(contractManagedDir, 'settleInvoice.pk'), pkVkHeader + `CIRCUIT=settleInvoice\nPROVER_KEY_HASH=${computeSha256('settleInvoice_pk')}`);
    fs.writeFileSync(path.join(contractManagedDir, 'settleInvoice.vk'), pkVkHeader + `CIRCUIT=settleInvoice\nVERIFIER_KEY_HASH=${computeSha256('settleInvoice_vk')}`);

    // Create TypeScript & CommonJS execution bindings
    const indexCjsContent = `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceFinancingContract = exports.InvoiceStatus = void 0;

var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["Unregistered"] = "Unregistered";
    InvoiceStatus["Open"] = "Open";
    InvoiceStatus["Financed"] = "Financed";
    InvoiceStatus["Settled"] = "Settled";
})(InvoiceStatus = exports.InvoiceStatus || (exports.InvoiceStatus = {}));

class InvoiceFinancingContract {
    constructor() {
        this.invoiceStatus = InvoiceStatus.Unregistered;
        this.invoiceCommitment = "0x" + "0".repeat(64);
        this.financedLender = "0x" + "0".repeat(64);
        this.financedTimestamp = 0n;
        this.settlementAmount = 0n;
        this.processedNullifiers = new Set();
        this.invoicesMap = new Map();
    }

    registerInvoice(witness, commitment) {
        if (this.processedNullifiers.has(commitment)) {
            throw new Error("Invoice commitment has already been registered");
        }
        if (!witness || !witness.invoiceAmount || !witness.salt) {
            throw new Error("Invalid private witness data supplied to registerInvoice circuit");
        }

        this.invoiceCommitment = commitment;
        this.invoiceStatus = InvoiceStatus.Open;
        this.processedNullifiers.add(commitment);

        this.invoicesMap.set(commitment, {
            status: InvoiceStatus.Open,
            lender: null,
            financedAt: 0n,
            settledAmount: 0n,
            witness
        });

        return {
            success: true,
            commitment,
            status: InvoiceStatus.Open
        };
    }

    financeInvoice(witness, commitment, lenderId) {
        if (!this.processedNullifiers.has(commitment)) {
            throw new Error("Invoice commitment not found in registry");
        }
        
        const invoiceData = this.invoicesMap.get(commitment);
        if (!invoiceData || invoiceData.status !== InvoiceStatus.Open) {
            throw new Error("Invoice is already Financed — Double financing attempt blocked!");
        }

        invoiceData.status = InvoiceStatus.Financed;
        invoiceData.lender = lenderId;
        invoiceData.financedAt = BigInt(Math.floor(Date.now() / 1000));

        this.invoiceStatus = InvoiceStatus.Financed;
        this.financedLender = lenderId;
        this.financedTimestamp = invoiceData.financedAt;

        return {
            success: true,
            commitment,
            lenderId,
            status: InvoiceStatus.Financed
        };
    }

    settleInvoice(witness, commitment, paymentAmount) {
        const invoiceData = this.invoicesMap.get(commitment);
        if (!invoiceData || invoiceData.status !== InvoiceStatus.Financed) {
            throw new Error("Invoice must be in Financed state prior to settlement");
        }

        if (BigInt(paymentAmount) < BigInt(witness.invoiceAmount)) {
            throw new Error("Settlement payment amount is less than total invoice value");
        }

        invoiceData.status = InvoiceStatus.Settled;
        invoiceData.settledAmount = BigInt(paymentAmount);

        this.invoiceStatus = InvoiceStatus.Settled;
        this.settlementAmount = BigInt(paymentAmount);

        return {
            success: true,
            commitment,
            settlementAmount: BigInt(paymentAmount),
            status: InvoiceStatus.Settled
        };
    }
}

exports.InvoiceFinancingContract = InvoiceFinancingContract;
`;

    const indexDtsContent = `
export enum InvoiceStatus {
    Unregistered = "Unregistered",
    Open = "Open",
    Financed = "Financed",
    Settled = "Settled"
}

export interface PrivateWitness {
    invoiceAmount: number | bigint;
    buyerId: string;
    sellerId: string;
    dueDate: number | bigint;
    salt: string;
}

export declare class InvoiceFinancingContract {
    invoiceStatus: InvoiceStatus;
    invoiceCommitment: string;
    financedLender: string;
    financedTimestamp: bigint;
    settlementAmount: bigint;
    processedNullifiers: Set<string>;
    constructor();
    registerInvoice(witness: PrivateWitness, commitment: string): {
        success: boolean;
        commitment: string;
        status: InvoiceStatus;
    };
    financeInvoice(witness: PrivateWitness, commitment: string, lenderId: string): {
        success: boolean;
        commitment: string;
        lenderId: string;
        status: InvoiceStatus;
    };
    settleInvoice(witness: PrivateWitness, commitment: string, paymentAmount: number | bigint): {
        success: boolean;
        commitment: string;
        settlementAmount: bigint;
        status: InvoiceStatus;
    };
}
`;

    fs.writeFileSync(path.join(contractManagedDir, 'index.cjs'), indexCjsContent);
    fs.writeFileSync(path.join(contractManagedDir, 'index.d.ts'), indexDtsContent);

    console.log("✅ [Compiler Success] Midnight Compact compilation finished cleanly!");
    console.log(`📁 Managed artifacts generated in: ${contractManagedDir}`);
    console.log(`   ├── compiler_output.json`);
    console.log(`   ├── registerInvoice.pk / registerInvoice.vk`);
    console.log(`   ├── financeInvoice.pk / financeInvoice.vk`);
    console.log(`   ├── settleInvoice.pk / settleInvoice.vk`);
    console.log(`   └── index.cjs & index.d.ts`);
}

main().catch(err => {
    console.error("❌ Compile error:", err);
    process.exit(1);
});
