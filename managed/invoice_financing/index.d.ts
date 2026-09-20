
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
