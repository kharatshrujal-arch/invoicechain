import React, { useState } from 'react';
import { DollarSign, ShieldCheck, Cpu, PieChart } from 'lucide-react';
import { midnightClient, InvoiceRecord, CircuitExecutionProgress } from '../utils/midnightClient';
import { formatTruncatedHash } from '../utils/cryptoUtils';
import { formatCurrency } from '../utils/currencyConverter';

interface FinanceInvoiceModalProps {
  invoices: InvoiceRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export const FinanceInvoiceModal: React.FC<FinanceInvoiceModalProps> = ({ invoices, onClose, onSuccess }) => {
  const openInvoices = invoices.filter(inv => inv.status === 'Open' || inv.status === 'PartiallyFinanced');
  const [selectedCommitment, setSelectedCommitment] = useState<string>(openInvoices[0]?.commitment || '');
  const [lenderName, setLenderName] = useState<string>('Apex Capital Partners');
  const [isPartialMode, setIsPartialMode] = useState<boolean>(false);
  const [partialAmount, setPartialAmount] = useState<string>('25000');

  const selectedInvoice = invoices.find(i => i.commitment === selectedCommitment);
  const currencyCode = selectedInvoice?.witness?.currencyCode || 'USD';
  const totalAmount = selectedInvoice?.witness?.invoiceAmount || 0;
  const currentFunded = selectedInvoice?.fundedAmount || 0;
  const remainingAmount = Math.max(0, totalAmount - currentFunded);

  const [progress, setProgress] = useState<CircuitExecutionProgress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommitment || !lenderName) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (isPartialMode) {
        const amt = parseFloat(partialAmount);
        if (isNaN(amt) || amt <= 0 || amt > remainingAmount) {
          throw new Error(`Partial amount must be between 1 and ${remainingAmount}`);
        }
        await midnightClient.financePartialInvoice(
          selectedCommitment,
          lenderName,
          amt,
          (prog) => setProgress(prog)
        );
      } else {
        await midnightClient.financeInvoice(
          selectedCommitment,
          lenderName,
          (prog) => setProgress(prog)
        );
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Circuit execution failed');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 9, 19, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign color="#06b6d4" size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Finance Invoice</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Midnight `financeInvoice` / `financePartial` ZK Circuit</p>
            </div>
          </div>
          {!isSubmitting && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          )}
        </div>

        {openInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>There are currently no Open or Partially Financed invoices available.</p>
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                Select Invoice Commitment Hash
              </label>
              <select
                value={selectedCommitment}
                onChange={e => setSelectedCommitment(e.target.value)}
                className="glass-input mono"
                required
                disabled={isSubmitting}
                style={{ fontSize: '0.85rem' }}
              >
                {openInvoices.map(inv => (
                  <option key={inv.commitment} value={inv.commitment} style={{ background: '#0f172a', color: '#fff' }}>
                    {formatTruncatedHash(inv.commitment, 8)} ({inv.status} - {formatCurrency(inv.witness.invoiceAmount, inv.witness.currencyCode || 'USD')})
                  </option>
                ))}
              </select>
            </div>

            {selectedInvoice && (
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  <span>Total Value: <strong>{formatCurrency(totalAmount, currencyCode)}</strong></span>
                  <span>Funded: <strong>{formatCurrency(currentFunded, currencyCode)}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#38bdf8' }}>
                  <span>Remaining Unfunded:</span>
                  <strong>{formatCurrency(remainingAmount, currencyCode)}</strong>
                </div>
              </div>
            )}

            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setIsPartialMode(false)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: !isPartialMode ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
                  background: !isPartialMode ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  color: !isPartialMode ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Full 100% Financing
              </button>
              <button
                type="button"
                onClick={() => setIsPartialMode(true)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: isPartialMode ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                  background: isPartialMode ? 'rgba(129, 140, 248, 0.15)' : 'transparent',
                  color: isPartialMode ? '#818cf8' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Partial Fractional Funding
              </button>
            </div>

            {isPartialMode && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Partial Contribution Amount ({currencyCode})
                </label>
                <input
                  type="number"
                  value={partialAmount}
                  max={remainingAmount}
                  onChange={e => setPartialAmount(e.target.value)}
                  className="glass-input"
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                Lender Institution Name
              </label>
              <input
                type="text"
                value={lenderName}
                onChange={e => setLenderName(e.target.value)}
                className="glass-input"
                placeholder="e.g. Apex Capital Partners"
                required
                disabled={isSubmitting}
              />
            </div>

            {errorMessage && (
              <div style={{ marginBottom: '1.25rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.8rem', color: '#f43f5e' }}>
                🛑 {errorMessage}
              </div>
            )}

            {progress && (
              <div style={{ marginBottom: '1.25rem', background: 'rgba(6, 182, 212, 0.08)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Cpu size={16} color="#06b6d4" className="pulse-active" />
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>{progress.message}</span>
                </div>
                <div className="zk-progress-bar">
                  <div className="zk-progress-fill" style={{ width: `${progress.progressPercent}%`, background: 'linear-gradient(90deg, #06b6d4, #10b981)' }}></div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' }} disabled={isSubmitting}>
                <ShieldCheck size={16} />
                {isSubmitting ? 'Proving & Financing...' : isPartialMode ? 'Fund Partial Fraction' : 'Finance 100% Invoice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

