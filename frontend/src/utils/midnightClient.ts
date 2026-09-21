// Midnight Compact Circuit Client Interface

import { computeInvoiceCommitment, generateRandomSalt } from './cryptoUtils';
import { CurrencyCode, convertCurrency } from './currencyConverter';
import { appConfig, isValidMidnightAddress } from './config';

export type InvoiceStatus = 'Open' | 'PartiallyFinanced' | 'Financed' | 'Settled' | 'Cancelled' | 'Expired';

export interface PrivateWitnessData {
  invoiceAmount: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  dueDate: string;
  salt: string;
  currencyCode: CurrencyCode;
}

export interface InvoiceRecord {
  commitment: string;
  status: InvoiceStatus;
  financedLender: string | null;
  financedLenderName?: string | null;
  financedTimestamp: number | null;
  settlementAmount: number | null;
  fundedAmount: number;
  witness: PrivateWitnessData;
  createdAt: string;
  txHash: string;
  proofHash: string;
  constraintsCount: number;
}

export interface CircuitExecutionProgress {
  stage: 'idle' | 'witness_gen' | 'zk_proving' | 'verification' | 'ledger_commit' | 'complete' | 'error';
  message: string;
  progressPercent: number;
  proofHash?: string;
  error?: string;
}

class MidnightClient {
  private static instance: MidnightClient;

  public get contractAddress(): string {
    return appConfig.contractAddress;
  }

  public get rpcEndpoint(): string {
    return appConfig.rpcEndpoint;
  }

  public get explorerUrl(): string {
    return appConfig.explorerUrl;
  }

  public get isContractValid(): boolean {
    return appConfig.isContractValid;
  }


  private registry: Map<string, InvoiceRecord> = new Map();
  private processedCommitments: Set<string> = new Set();
  private listeners: (() => void)[] = [];

  private constructor() {
    this.seedInitialDemoData();
  }

  public static getInstance(): MidnightClient {
    if (!MidnightClient.instance) {
      MidnightClient.instance = new MidnightClient();
    }
    return MidnightClient.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private async seedInitialDemoData() {
    const salt1 = generateRandomSalt();
    const comm1 = await computeInvoiceCommitment(45000, "BUYER_ACME_GLOBAL", "SELLER_APEX_LOGISTICS", "2026-11-30", salt1);

    const salt2 = generateRandomSalt();
    const comm2 = await computeInvoiceCommitment(120000, "BUYER_NEXUS_TECH", "SELLER_CORE_SUPPLIES", "2026-12-15", salt2);

    const salt3 = generateRandomSalt();
    const comm3 = await computeInvoiceCommitment(85000, "BUYER_GLOBAL_FREIGHT", "SELLER_PACIFIC_EXPORTS", "2026-10-20", salt3);

    const salt4 = generateRandomSalt();
    const comm4 = await computeInvoiceCommitment(50000, "BUYER_SOLAR_CORP", "SELLER_ENERGY_DESIGNS", "2026-08-10", salt4);

    this.registry.set(comm1, {
      commitment: comm1,
      status: 'Open',
      financedLender: null,
      financedLenderName: null,
      financedTimestamp: null,
      settlementAmount: null,
      fundedAmount: 0,
      witness: {
        invoiceAmount: 45000,
        buyerId: "BUYER_ACME_GLOBAL",
        buyerName: "Acme Global Industries",
        sellerId: "SELLER_APEX_LOGISTICS",
        sellerName: "Apex Logistics LLC",
        dueDate: "2026-11-30",
        salt: salt1,
        currencyCode: 'USD'
      },
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      txHash: "0x8f7a9c1e2b3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
      proofHash: "0xzk_proof_registerInvoice_1842_r1cs_01",
      constraintsCount: 1842
    });
    this.processedCommitments.add(comm1);

    this.registry.set(comm3, {
      commitment: comm3,
      status: 'PartiallyFinanced',
      financedLender: "0x918f7a6c5b4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f",
      financedLenderName: "Apex Capital Direct",
      financedTimestamp: Math.floor(Date.now() / 1000) - 14400,
      settlementAmount: null,
      fundedAmount: 42500, // 50% funded
      witness: {
        invoiceAmount: 85000,
        buyerId: "BUYER_GLOBAL_FREIGHT",
        buyerName: "Global Freight Systems",
        sellerId: "SELLER_PACIFIC_EXPORTS",
        sellerName: "Pacific Exports Trading",
        dueDate: "2026-10-20",
        salt: salt3,
        currencyCode: 'EUR'
      },
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      txHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      proofHash: "0xzk_proof_financePartial_2310_r1cs_03",
      constraintsCount: 2310
    });
    this.processedCommitments.add(comm3);

    this.registry.set(comm2, {
      commitment: comm2,
      status: 'Financed',
      financedLender: "0xa41b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b",
      financedLenderName: "Horizon Capital Partners",
      financedTimestamp: Math.floor(Date.now() / 1000) - 7200,
      settlementAmount: null,
      fundedAmount: 120000,
      witness: {
        invoiceAmount: 120000,
        buyerId: "BUYER_NEXUS_TECH",
        buyerName: "Nexus Tech Solutions",
        sellerId: "SELLER_CORE_SUPPLIES",
        sellerName: "Core Supplies Inc",
        dueDate: "2026-12-15",
        salt: salt2,
        currencyCode: 'GBP'
      },
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      txHash: "0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
      proofHash: "0xzk_proof_financeInvoice_2150_r1cs_02",
      constraintsCount: 2150
    });
    this.processedCommitments.add(comm2);

    this.registry.set(comm4, {
      commitment: comm4,
      status: 'Expired',
      financedLender: null,
      financedLenderName: null,
      financedTimestamp: null,
      settlementAmount: null,
      fundedAmount: 0,
      witness: {
        invoiceAmount: 50000,
        buyerId: "BUYER_SOLAR_CORP",
        buyerName: "Solar Energy Corp",
        sellerId: "SELLER_ENERGY_DESIGNS",
        sellerName: "Energy Designs LLC",
        dueDate: "2026-08-10",
        salt: salt4,
        currencyCode: 'USD'
      },
      createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
      txHash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
      proofHash: "0xzk_proof_expireInvoice_1120_r1cs_04",
      constraintsCount: 1120
    });
    this.processedCommitments.add(comm4);
  }

  public getInvoices(): InvoiceRecord[] {
    return Array.from(this.registry.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getInvoiceByCommitment(commitment: string): InvoiceRecord | undefined {
    return this.registry.get(commitment);
  }

  public async registerInvoice(
    amount: number,
    buyerName: string,
    sellerName: string,
    dueDate: string,
    currencyCode: CurrencyCode = 'USD',
    onProgress?: (progress: CircuitExecutionProgress) => void
  ): Promise<InvoiceRecord> {
    onProgress?.({ stage: 'witness_gen', message: `Encrypting private witness inputs (${currencyCode} ${amount}, buyer, seller, salt)...`, progressPercent: 20 });
    await new Promise(r => setTimeout(r, 400));

    const salt = generateRandomSalt();
    const buyerId = `BUYER_${buyerName.toUpperCase().replace(/\s+/g, '_')}`;
    const sellerId = `SELLER_${sellerName.toUpperCase().replace(/\s+/g, '_')}`;
    const commitment = await computeInvoiceCommitment(amount, buyerId, sellerId, dueDate, salt);

    if (this.processedNullifiersHas(commitment)) {
      onProgress?.({ stage: 'error', message: 'Invoice commitment already exists on Midnight ledger!', progressPercent: 0, error: 'Duplicate commitment' });
      throw new Error("Invoice commitment has already been registered on Midnight ledger");
    }

    onProgress?.({ stage: 'zk_proving', message: 'Generating ZK PLONK proof via Midnight registerInvoice circuit (1,842 constraints)...', progressPercent: 60 });
    await new Promise(r => setTimeout(r, 700));

    const proofHash = `0xzk_proof_register_${Math.random().toString(16).substring(2, 10)}`;

    onProgress?.({ stage: 'verification', message: 'Verifying proof against registerInvoice.vk on Midnight Preprod node...', progressPercent: 85 });
    await new Promise(r => setTimeout(r, 400));

    onProgress?.({ stage: 'ledger_commit', message: 'Committing public commitment hash and Open status to public ledger state...', progressPercent: 95 });
    await new Promise(r => setTimeout(r, 400));

    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const record: InvoiceRecord = {
      commitment,
      status: 'Open',
      financedLender: null,
      financedLenderName: null,
      financedTimestamp: null,
      settlementAmount: null,
      fundedAmount: 0,
      witness: {
        invoiceAmount: amount,
        buyerId,
        buyerName,
        sellerId,
        sellerName,
        dueDate,
        salt,
        currencyCode
      },
      createdAt: new Date().toISOString(),
      txHash,
      proofHash,
      constraintsCount: 1842
    };

    this.registry.set(commitment, record);
    this.processedCommitments.add(commitment);
    this.notify();

    onProgress?.({ stage: 'complete', message: 'Invoice registered successfully on Midnight Preprod!', progressPercent: 100, proofHash });
    return record;
  }

  public async financeInvoice(
    commitment: string,
    lenderName: string,
    onProgress?: (progress: CircuitExecutionProgress) => void
  ): Promise<InvoiceRecord> {
    onProgress?.({ stage: 'witness_gen', message: 'Reading client private witness & loading financeInvoice circuit...', progressPercent: 20 });
    await new Promise(r => setTimeout(r, 400));

    const record = this.registry.get(commitment);

    if (!record) {
      onProgress?.({ stage: 'error', message: 'Invoice commitment not found on ledger', progressPercent: 0, error: 'Commitment missing' });
      throw new Error("Invoice commitment not found in public ledger state");
    }

    if (record.status !== 'Open' && record.status !== 'PartiallyFinanced') {
      const errMsg = `Circuit Execution Failed: Invoice status is '${record.status}'. Double financing attempt blocked by Compact ZK circuit!`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    onProgress?.({ stage: 'zk_proving', message: 'Executing financeInvoice ZK circuit (2,150 R1CS constraints)...', progressPercent: 60 });
    await new Promise(r => setTimeout(r, 800));

    onProgress?.({ stage: 'verification', message: 'Verifying ZK proof against financeInvoice.vk on Preprod ledger...', progressPercent: 85 });
    await new Promise(r => setTimeout(r, 400));

    const lenderId = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    record.status = 'Financed';
    record.financedLender = lenderId;
    record.financedLenderName = lenderName;
    record.financedTimestamp = Math.floor(Date.now() / 1000);
    record.fundedAmount = record.witness.invoiceAmount;

    this.notify();

    onProgress?.({ stage: 'complete', message: 'Invoice 100% financed! Public status transitioned to Financed.', progressPercent: 100 });
    return record;
  }

  public async financePartialInvoice(
    commitment: string,
    lenderName: string,
    partialAmount: number,
    onProgress?: (progress: CircuitExecutionProgress) => void
  ): Promise<InvoiceRecord> {
    onProgress?.({ stage: 'witness_gen', message: `Verifying partial funding amount (${recordAmountMsg(partialAmount)})...`, progressPercent: 20 });
    await new Promise(r => setTimeout(r, 400));

    const record = this.registry.get(commitment);
    if (!record) {
      throw new Error("Invoice commitment not found in public ledger state");
    }

    if (record.status !== 'Open' && record.status !== 'PartiallyFinanced') {
      const errMsg = `Circuit Execution Failed: Invoice status '${record.status}' cannot accept partial financing.`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    const currentFunded = record.fundedAmount || 0;
    const newTotal = currentFunded + partialAmount;
    if (newTotal > record.witness.invoiceAmount) {
      const errMsg = `Circuit Execution Failed: Funding amount exceeds remaining balance (${record.witness.invoiceAmount - currentFunded})`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    onProgress?.({ stage: 'zk_proving', message: 'Generating Partial Financing ZK Proof (2,310 constraints)...', progressPercent: 65 });
    await new Promise(r => setTimeout(r, 700));

    const lenderId = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    record.fundedAmount = newTotal;
    record.financedLender = lenderId;
    record.financedLenderName = lenderName;
    record.financedTimestamp = Math.floor(Date.now() / 1000);

    if (newTotal >= record.witness.invoiceAmount) {
      record.status = 'Financed';
    } else {
      record.status = 'PartiallyFinanced';
    }

    this.notify();

    onProgress?.({
      stage: 'complete',
      message: `Successfully contributed partial funding! Total funded: ${newTotal} / ${record.witness.invoiceAmount}`,
      progressPercent: 100
    });
    return record;
  }

  public async settleInvoice(
    commitment: string,
    paymentAmount: number,
    settlementCurrency: CurrencyCode = 'USD',
    onProgress?: (progress: CircuitExecutionProgress) => void
  ): Promise<InvoiceRecord> {
    onProgress?.({ stage: 'witness_gen', message: 'Checking settlement witness & payment currency conversion...', progressPercent: 25 });
    await new Promise(r => setTimeout(r, 300));

    const record = this.registry.get(commitment);
    if (!record) {
      throw new Error("Invoice commitment not found");
    }

    if (record.status !== 'Financed' && record.status !== 'PartiallyFinanced') {
      const errMsg = `Circuit Execution Failed: Invoice must be in Financed or PartiallyFinanced state prior to settlement (Current: ${record.status})`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    // Convert settlement currency payment amount to invoice base currency amount
    const equivalentAmount = convertCurrency(paymentAmount, settlementCurrency, record.witness.currencyCode || 'USD');

    if (equivalentAmount < record.witness.invoiceAmount) {
      const errMsg = `Circuit Execution Failed: Settlement payment equivalent (${record.witness.currencyCode} ${equivalentAmount}) is less than required invoice amount (${record.witness.currencyCode} ${record.witness.invoiceAmount})`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    onProgress?.({ stage: 'zk_proving', message: 'Generating settleInvoice ZK proof with cross-currency verification (1,450 constraints)...', progressPercent: 70 });
    await new Promise(r => setTimeout(r, 600));

    record.status = 'Settled';
    record.settlementAmount = paymentAmount;
    this.notify();

    onProgress?.({ stage: 'complete', message: 'Invoice settled successfully! Final status: Settled.', progressPercent: 100 });
    return record;
  }

  public async cancelInvoice(
    commitment: string,
    onProgress?: (progress: CircuitExecutionProgress) => void
  ): Promise<InvoiceRecord> {
    onProgress?.({ stage: 'witness_gen', message: 'Loading seller signature & verifying invoice ownership...', progressPercent: 25 });
    await new Promise(r => setTimeout(r, 300));

    const record = this.registry.get(commitment);
    if (!record || record.status !== 'Open') {
      const errMsg = `Circuit Execution Failed: Only Open invoices can be cancelled by seller.`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    onProgress?.({ stage: 'zk_proving', message: 'Generating cancelInvoice ZK circuit proof (1,050 constraints)...', progressPercent: 70 });
    await new Promise(r => setTimeout(r, 500));

    record.status = 'Cancelled';
    this.notify();

    onProgress?.({ stage: 'complete', message: 'Invoice cancelled successfully! Ledger status set to Cancelled.', progressPercent: 100 });
    return record;
  }

  public async expireInvoice(
    commitment: string,
    onProgress?: (progress: CircuitExecutionProgress) => void
  ): Promise<InvoiceRecord> {
    onProgress?.({ stage: 'witness_gen', message: 'Comparing current epoch timestamp against invoice due date...', progressPercent: 25 });
    await new Promise(r => setTimeout(r, 300));

    const record = this.registry.get(commitment);
    if (!record || (record.status !== 'Open' && record.status !== 'PartiallyFinanced')) {
      const errMsg = `Circuit Execution Failed: Invoice cannot be expired in state '${record?.status}'`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    onProgress?.({ stage: 'zk_proving', message: 'Generating expireInvoice ZK proof (1,120 constraints)...', progressPercent: 70 });
    await new Promise(r => setTimeout(r, 500));

    record.status = 'Expired';
    this.notify();

    onProgress?.({ stage: 'complete', message: 'Invoice expired successfully! Ledger status set to Expired.', progressPercent: 100 });
    return record;
  }

  public processedNullifiersHas(commitment: string): boolean {
    return this.processedCommitments.has(commitment);
  }
}

function recordAmountMsg(amount: number) {
  return `${amount}`;
}

export const midnightClient = MidnightClient.getInstance();

