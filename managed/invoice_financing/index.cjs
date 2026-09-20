
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
