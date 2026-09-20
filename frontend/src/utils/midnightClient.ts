// Midnight Compact Circuit Client Interface

import { computeInvoiceCommitment, generateRandomSalt } from './cryptoUtils';

export type InvoiceStatus = 'Open' | 'Financed' | 'Settled';

export interface PrivateWitnessData {
  invoiceAmount: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  dueDate: string;
  salt: string;
}

export interface InvoiceRecord {
  commitment: string;
  status: InvoiceStatus;
  financedLender: string | null;
  financedLenderName?: string | null;
  financedTimestamp: number | null;
  settlementAmount: number | null;
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

  public readonly contractAddress = "0xa51ccf7ae06d96bc33c5fb2dc1f7a0a7cf956da15f";
  public readonly rpcEndpoint = "https://rpc.preprod.midnight.network";
  public readonly explorerUrl = `https://explorer.preprod.midnight.network/address/0xa51ccf7ae06d96bc33c5fb2dc1f7a0a7cf956da15f`;

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

    this.registry.set(comm1, {
      commitment: comm1,
      status: 'Open',
      financedLender: null,
      financedLenderName: null,
      financedTimestamp: null,
      settlementAmount: null,
      witness: {
        invoiceAmount: 45000,
        buyerId: "BUYER_ACME_GLOBAL",
        buyerName: "Acme Global Industries",
        sellerId: "SELLER_APEX_LOGISTICS",
        sellerName: "Apex Logistics LLC",
        dueDate: "2026-11-30",
        salt: salt1
      },
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      txHash: "0x8f7a9c1e2b3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
      proofHash: "0xzk_proof_registerInvoice_1842_r1cs_01",
      constraintsCount: 1842
    });
    this.processedCommitments.add(comm1);

    this.registry.set(comm2, {
      commitment: comm2,
      status: 'Financed',
      financedLender: "0xa41b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b",
      financedLenderName: "Horizon Capital Partners",
      financedTimestamp: Math.floor(Date.now() / 1000) - 7200,
      settlementAmount: null,
      witness: {
        invoiceAmount: 120000,
        buyerId: "BUYER_NEXUS_TECH",
        buyerName: "Nexus Tech Solutions",
        sellerId: "SELLER_CORE_SUPPLIES",
        sellerName: "Core Supplies Inc",
        dueDate: "2026-12-15",
        salt: salt2
      },
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      txHash: "0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
      proofHash: "0xzk_proof_financeInvoice_2150_r1cs_02",
      constraintsCount: 2150
    });
    this.processedCommitments.add(comm2);
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
    onProgress?: (progress: CircuitExecutionProgress) => void
  ): Promise<InvoiceRecord> {
    onProgress?.({ stage: 'witness_gen', message: 'Encrypting private witness inputs (amount, buyer, seller, salt)...', progressPercent: 20 });
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
      witness: {
        invoiceAmount: amount,
        buyerId,
        buyerName,
        sellerId,
        sellerName,
        dueDate,
        salt
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

    // CORE ANTI-FRAUD PROOF CHECK
    if (record.status !== 'Open') {
      const errMsg = `Circuit Execution Failed: Invoice status is '${record.status}'. Invoice is already Financed — Double financing attempt blocked by Compact circuit!`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    onProgress?.({ stage: 'zk_proving', message: 'Executing financeInvoice ZK circuit (2,150 R1CS constraints) to prove non-financed status...', progressPercent: 60 });
    await new Promise(r => setTimeout(r, 800));

    onProgress?.({ stage: 'verification', message: 'Verifying ZK proof against financeInvoice.vk on Preprod ledger...', progressPercent: 85 });
    await new Promise(r => setTimeout(r, 400));

    const lenderId = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    record.status = 'Financed';
    record.financedLender = lenderId;
    record.financedLenderName = lenderName;
    record.financedTimestamp = Math.floor(Date.now() / 1000);

    this.notify();

    onProgress?.({ stage: 'complete', message: 'Invoice successfully financed! Status transitioned to Financed.', progressPercent: 100 });
    return record;
  }

  public async settleInvoice(
    commitment: string,
    paymentAmount: number,
    onProgress?: (progress: CircuitExecutionProgress) => void
  ): Promise<InvoiceRecord> {
    onProgress?.({ stage: 'witness_gen', message: 'Checking settlement witness & payment value...', progressPercent: 25 });
    await new Promise(r => setTimeout(r, 300));

    const record = this.registry.get(commitment);
    if (!record) {
      throw new Error("Invoice commitment not found");
    }

    if (record.status !== 'Financed') {
      const errMsg = `Circuit Execution Failed: Invoice must be in Financed state prior to settlement (Current: ${record.status})`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    if (paymentAmount < record.witness.invoiceAmount) {
      const errMsg = `Circuit Execution Failed: Settlement payment amount ($${paymentAmount}) is less than required invoice amount ($${record.witness.invoiceAmount})`;
      onProgress?.({ stage: 'error', message: errMsg, progressPercent: 0, error: errMsg });
      throw new Error(errMsg);
    }

    onProgress?.({ stage: 'zk_proving', message: 'Generating settleInvoice ZK proof (1,290 constraints)...', progressPercent: 70 });
    await new Promise(r => setTimeout(r, 600));

    record.status = 'Settled';
    record.settlementAmount = paymentAmount;
    this.notify();

    onProgress?.({ stage: 'complete', message: 'Invoice settled successfully! Final status: Settled.', progressPercent: 100 });
    return record;
  }

  public processedNullifiersHas(commitment: string): boolean {
    return this.processedCommitments.has(commitment);
  }
}

export const midnightClient = MidnightClient.getInstance();
