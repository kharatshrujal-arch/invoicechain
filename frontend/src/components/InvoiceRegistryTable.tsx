import React from 'react';
import { Database, Eye, ShieldCheck, DollarSign, CheckCircle2, ExternalLink, XCircle, Clock } from 'lucide-react';
import { InvoiceRecord, midnightClient } from '../utils/midnightClient';
import { formatTruncatedHash } from '../utils/cryptoUtils';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../utils/currencyConverter';

interface InvoiceRegistryTableProps {
  invoices: InvoiceRecord[];
  selectedCommitment: string | null;
  onSelectInvoice: (invoice: InvoiceRecord) => void;
  onOpenFinanceModal: () => void;
  onOpenSettleModal: () => void;
  explorerUrl: string;
}

export const InvoiceRegistryTable: React.FC<InvoiceRegistryTableProps> = ({
  invoices,
  selectedCommitment,
  onSelectInvoice,
  onOpenFinanceModal,
  onOpenSettleModal,
  explorerUrl
}) => {
  const handleCancelInvoice = async (e: React.MouseEvent, commitment: string) => {
    e.stopPropagation();
    try {
      await midnightClient.cancelInvoice(commitment);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExpireInvoice = async (e: React.MouseEvent, commitment: string) => {
    e.stopPropagation();
    try {
      await midnightClient.expireInvoice(commitment);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Database color="#06b6d4" size={22} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Registered Invoice Commitments Ledger
          </h2>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Total Commitments: <strong style={{ color: '#06b6d4' }}>{invoices.length}</strong>
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Invoice Commitment Hash</th>
              <th style={{ padding: '0.75rem 1rem' }}>Public Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Private Witness (Local Only)</th>
              <th style={{ padding: '0.75rem 1rem' }}>Financed Lender / Progress</th>
              <th style={{ padding: '0.75rem 1rem' }}>Tx / Proof</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const isSelected = selectedCommitment === inv.commitment;
              const currencyCode = inv.witness.currencyCode || 'USD';
              const currencyConfig = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
              const fundedPct = inv.witness.invoiceAmount > 0
                ? Math.min(100, Math.round(((inv.fundedAmount || (inv.status === 'Financed' || inv.status === 'Settled' ? inv.witness.invoiceAmount : 0)) / inv.witness.invoiceAmount) * 100))
                : 0;

              return (
                <tr
                  key={inv.commitment}
                  onClick={() => onSelectInvoice(inv)}
                  style={{
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="mono" style={{ fontSize: '0.85rem', color: isSelected ? '#818cf8' : '#38bdf8', fontWeight: 600 }}>
                        {formatTruncatedHash(inv.commitment, 6)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-${inv.status.toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{currencyConfig.flag}</span>
                      <span>{formatCurrency(inv.witness.invoiceAmount, currencyCode)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {inv.witness.buyerName} → {inv.witness.sellerName}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {inv.status === 'PartiallyFinanced' ? (
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.2rem' }}>
                          Funded: {fundedPct}% ({formatCurrency(inv.fundedAmount, currencyCode)})
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', height: '5px', borderRadius: '4px', overflow: 'hidden', width: '120px' }}>
                          <div style={{ width: `${fundedPct}%`, height: '100%', background: '#818cf8' }} />
                        </div>
                      </div>
                    ) : inv.financedLenderName ? (
                      <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
                        {inv.financedLenderName}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Unfinanced</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: '0.75rem', color: '#818cf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <span className="mono">{formatTruncatedHash(inv.txHash, 4)}</span>
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInvoice(inv);
                        }}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        <Eye size={12} /> Inspect
                      </button>

                      {(inv.status === 'Open' || inv.status === 'PartiallyFinanced') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFinanceModal();
                          }}
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' }}
                        >
                          <DollarSign size={12} /> Finance
                        </button>
                      )}

                      {(inv.status === 'Financed' || inv.status === 'PartiallyFinanced') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSettleModal();
                          }}
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }}
                        >
                          <CheckCircle2 size={12} /> Settle
                        </button>
                      )}

                      {inv.status === 'Open' && (
                        <button
                          onClick={(e) => handleCancelInvoice(e, inv.commitment)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }}
                          title="Cancel Invoice"
                        >
                          <XCircle size={12} /> Cancel
                        </button>
                      )}

                      {(inv.status === 'Open' || inv.status === 'PartiallyFinanced') && (
                        <button
                          onClick={(e) => handleExpireInvoice(e, inv.commitment)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }}
                          title="Expire Overdue Invoice"
                        >
                          <Clock size={12} /> Expire
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

