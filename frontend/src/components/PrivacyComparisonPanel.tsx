import React from 'react';
import { Eye, EyeOff, ShieldCheck, Lock, Globe, Database } from 'lucide-react';
import { InvoiceRecord } from '../utils/midnightClient';
import { formatCurrency, formatTruncatedHash } from '../utils/cryptoUtils';

interface PrivacyComparisonPanelProps {
  invoice: InvoiceRecord | null;
}

export const PrivacyComparisonPanel: React.FC<PrivacyComparisonPanelProps> = ({ invoice }) => {
  if (!invoice) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Select an invoice from the table below to inspect its live Privacy Model & Ledger State comparison.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck color="#818cf8" size={22} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              Observable Privacy Model & Zero-Knowledge Verification
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Comparing Midnight Public Ledger State vs. Encrypted Client Witness for Commitment: <span className="mono" style={{ color: '#06b6d4' }}>{formatTruncatedHash(invoice.commitment, 8)}</span>
          </p>
        </div>
        <div>
          <span className={`badge badge-${invoice.status.toLowerCase()}`}>
            Status: {invoice.status}
          </span>
        </div>
      </div>

      {/* Side by Side Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* PUBLIC LEDGER STATE */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '14px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} color="#06b6d4" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#06b6d4' }}>Public Ledger State</h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(6, 182, 212, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Visible on Midnight Explorer
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>Commitment Hash (`invoiceCommitment`):</span>
              <div className="mono" style={{ fontSize: '0.8rem', color: '#38bdf8', background: 'rgba(9, 13, 22, 0.6)', padding: '0.4rem 0.6rem', borderRadius: '6px', wordBreak: 'break-all' }}>
                {invoice.commitment}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Lifecycle Status (`invoiceStatus`):</span>
                <span className="mono" style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>{invoice.status}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Financed Lender ID (`financedLender`):</span>
                <span className="mono" style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                  {invoice.financedLender ? formatTruncatedHash(invoice.financedLender, 4) : 'null'}
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px dashed rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '0.6rem 0.8rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <EyeOff size={14} color="#f43f5e" />
                <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 600 }}>Public Privacy Protection</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#fda4af', marginTop: '0.2rem' }}>
                Invoice amount, buyer corporate identity, seller MSME name, and due date are <strong>NOT present</strong> in any form on the public ledger.
              </p>
            </div>
          </div>
        </div>

        {/* PRIVATE WITNESS DATA */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '14px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="#818cf8" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#818cf8' }}>Encrypted Private Witness</h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Client Witness Only
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Invoice Amount (`invoiceAmount`):</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                  {formatCurrency(invoice.witness.invoiceAmount)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Payment Due Date (`dueDate`):</span>
                <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                  {invoice.witness.dueDate}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Buyer Corporate Identity (`buyerId`):</span>
              <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
                {invoice.witness.buyerName} <span className="mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>({invoice.witness.buyerId})</span>
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Seller MSME Identity (`sellerId`):</span>
              <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
                {invoice.witness.sellerName} <span className="mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>({invoice.witness.sellerId})</span>
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Cryptographic Salt (`salt`):</span>
              <div className="mono" style={{ fontSize: '0.75rem', color: '#a5b4fc', background: 'rgba(9, 13, 22, 0.6)', padding: '0.4rem 0.6rem', borderRadius: '6px', wordBreak: 'break-all' }}>
                {invoice.witness.salt}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
