
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceFinancingContract = exports.InvoiceStatus = void 0;

var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["Unregistered"] = "Unregistered";
    InvoiceStatus["Open"] = "Open";
    InvoiceStatus["PartiallyFinanced"] = "PartiallyFinanced";
    InvoiceStatus["Financed"] = "Financed";
    InvoiceStatus["Settled"] = "Settled";
    InvoiceStatus["Cancelled"] = "Cancelled";
    InvoiceStatus["Expired"] = "Expired";
})(InvoiceStatus = exports.InvoiceStatus || (exports.InvoiceStatus = {}));

class InvoiceFinancingContract {
    constructor() {
        this.invoiceStatus = InvoiceStatus.Unregistered;
        this.invoiceCommitment = "0x" + "0".repeat(64);
        this.financedLender = "0x" + "0".repeat(64);
        this.financedTimestamp = 0n;
        this.settlementAmount = 0n;
        this.fundedAmount = 0n;
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
            fundedAmount: 0n,
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
        if (!invoiceData || (invoiceData.status !== InvoiceStatus.Open && invoiceData.status !== InvoiceStatus.PartiallyFinanced)) {
            throw new Error("Invoice is already Financed — Double financing attempt blocked!");
        }

        const totalAmount = BigInt(witness.invoiceAmount);
        invoiceData.status = InvoiceStatus.Financed;
        invoiceData.lender = lenderId;
        invoiceData.financedAt = BigInt(Math.floor(Date.now() / 1000));
        invoiceData.fundedAmount = totalAmount;

        this.invoiceStatus = InvoiceStatus.Financed;
        this.financedLender = lenderId;
        this.financedTimestamp = invoiceData.financedAt;
        this.fundedAmount = totalAmount;

        return {
            success: true,
            commitment,
            lenderId,
            status: InvoiceStatus.Financed
        };
    }

    financePartialInvoice(witness, commitment, lenderId, partialAmount) {
        if (!this.processedNullifiers.has(commitment)) {
            throw new Error("Invoice commitment not found in registry");
        }

        const invoiceData = this.invoicesMap.get(commitment);
        if (!invoiceData || (invoiceData.status !== InvoiceStatus.Open && invoiceData.status !== InvoiceStatus.PartiallyFinanced)) {
            throw new Error("Invoice is already Financed — Double financing attempt blocked!");
        }

        const addAmount = BigInt(partialAmount);
        const currentFunded = invoiceData.fundedAmount || 0n;
        const newFundedAmount = currentFunded + addAmount;
        const totalAmount = BigInt(witness.invoiceAmount);

        if (newFundedAmount > totalAmount) {
            throw new Error("Partial funding exceeds total invoice amount");
        }

        const isFullyFunded = newFundedAmount === totalAmount;
        const newStatus = isFullyFunded ? InvoiceStatus.Financed : InvoiceStatus.PartiallyFinanced;

        invoiceData.status = newStatus;
        invoiceData.lender = lenderId;
        invoiceData.financedAt = BigInt(Math.floor(Date.now() / 1000));
        invoiceData.fundedAmount = newFundedAmount;

        this.invoiceStatus = newStatus;
        this.financedLender = lenderId;
        this.financedTimestamp = invoiceData.financedAt;
        this.fundedAmount = newFundedAmount;

        return {
            success: true,
            commitment,
            lenderId,
            fundedAmount: newFundedAmount,
            status: newStatus
        };
    }

    settleInvoice(witness, commitment, paymentAmount) {
        const invoiceData = this.invoicesMap.get(commitment);
        if (!invoiceData || (invoiceData.status !== InvoiceStatus.Financed && invoiceData.status !== InvoiceStatus.PartiallyFinanced)) {
            throw new Error("Invoice must be in Financed or PartiallyFinanced state prior to settlement");
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

    cancelInvoice(witness, commitment) {
        if (!this.processedNullifiers.has(commitment)) {
            throw new Error("Invoice commitment not found in registry");
        }

        const invoiceData = this.invoicesMap.get(commitment);
        if (!invoiceData || invoiceData.status !== InvoiceStatus.Open) {
            throw new Error("Only open invoices can be cancelled");
        }

        invoiceData.status = InvoiceStatus.Cancelled;
        this.invoiceStatus = InvoiceStatus.Cancelled;

        return {
            success: true,
            commitment,
            status: InvoiceStatus.Cancelled
        };
    }

    expireInvoice(witness, commitment, currentTimestamp) {
        if (!this.processedNullifiers.has(commitment)) {
            throw new Error("Invoice commitment not found in registry");
        }

        const invoiceData = this.invoicesMap.get(commitment);
        if (!invoiceData || (invoiceData.status !== InvoiceStatus.Open && invoiceData.status !== InvoiceStatus.PartiallyFinanced)) {
            throw new Error("Invoice cannot be expired in its current state");
        }

        const dueDateTimestamp = BigInt(witness.dueDate || 0);
        if (BigInt(currentTimestamp) <= dueDateTimestamp) {
            throw new Error("Invoice has not passed its due date");
        }

        invoiceData.status = InvoiceStatus.Expired;
        this.invoiceStatus = InvoiceStatus.Expired;

        return {
            success: true,
            commitment,
            status: InvoiceStatus.Expired
        };
    }
}

exports.InvoiceFinancingContract = InvoiceFinancingContract;

