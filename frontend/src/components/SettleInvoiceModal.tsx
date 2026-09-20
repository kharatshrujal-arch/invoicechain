import React, { useState } from 'react';
import { CheckCircle2, Cpu } from 'lucide-react';
import { midnightClient, InvoiceRecord, CircuitExecutionProgress } from '../utils/midnightClient';
import { formatTruncatedHash } from '../utils/cryptoUtils';

interface SettleInvoiceModalProps {
  invoices: InvoiceRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export const SettleInvoiceModal: React.FC<SettleInvoiceModalProps> = ({ invoices, onClose, onSuccess }) => {
  const financedInvoices = invoices.filter(inv => inv.status === 'Financed');
  const [selectedCommitment, setSelectedCommitment] = useState<string>(financedInvoices[0]?.commitment || '');
  const [paymentAmount, setPaymentAmount] = useState<string>(financedInvoices[0] ? String(financedInvoices[0].witness.invoiceAmount) : '50000');

  const [progress, setProgress] = useState<CircuitExecutionProgress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommitment || !paymentAmount) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await midnightClient.settleInvoice(
        selectedCommitment,
        parseFloat(paymentAmount),
        (prog) => setProgress(prog)
      );
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Settlement circuit execution failed');
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 color="#c084fc" size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Settle Financed Invoice</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Midnight `settleInvoice` ZK Circuit</p>
            </div>
          </div>
          {!isSubmitting && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          )}
        </div>

        {financedInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>There are currently no Financed invoices ready for settlement.</p>
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                Select Financed Invoice Commitment
              </label>
              <select
                value={selectedCommitment}
                onChange={e => {
                  setSelectedCommitment(e.target.value);
                  const selected = financedInvoices.find(i => i.commitment === e.target.value);
                  if (selected) setPaymentAmount(String(selected.witness.invoiceAmount));
                }}
                className="glass-input mono"
                required
                disabled={isSubmitting}
                style={{ fontSize: '0.85rem' }}
              >
                {financedInvoices.map(inv => (
                  <option key={inv.commitment} value={inv.commitment} style={{ background: '#0f172a', color: '#fff' }}>
                    {formatTruncatedHash(inv.commitment, 8)} (Financed by: {inv.financedLenderName || 'Lender'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                Settlement Payment Amount ($ USD)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                className="glass-input"
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
              <div style={{ marginBottom: '1.25rem', background: 'rgba(168, 85, 247, 0.08)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Cpu size={16} color="#c084fc" className="pulse-active" />
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>{progress.message}</span>
                </div>
                <div className="zk-progress-bar">
                  <div className="zk-progress-fill" style={{ width: `${progress.progressPercent}%`, background: 'linear-gradient(90deg, #c084fc, #6366f1)' }}></div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }} disabled={isSubmitting}>
                <CheckCircle2 size={16} />
                {isSubmitting ? 'Proving Settlement...' : 'Settle Invoice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
