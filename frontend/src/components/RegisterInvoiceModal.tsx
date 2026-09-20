import React, { useState } from 'react';
import { Shield, Sparkles, CheckCircle, AlertCircle, Cpu } from 'lucide-react';
import { midnightClient, CircuitExecutionProgress } from '../utils/midnightClient';
import { generateRandomSalt } from '../utils/cryptoUtils';

interface RegisterInvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterInvoiceModal: React.FC<RegisterInvoiceModalProps> = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState<string>('75000');
  const [buyerName, setBuyerName] = useState<string>('Global Logistics Corp');
  const [sellerName, setSellerName] = useState<string>('Apex Manufacturing LLC');
  const [dueDate, setDueDate] = useState<string>('2026-12-31');
  const [salt, setSalt] = useState<string>(generateRandomSalt());

  const [progress, setProgress] = useState<CircuitExecutionProgress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !buyerName || !sellerName || !dueDate) return;

    setIsSubmitting(true);
    try {
      await midnightClient.registerInvoice(
        parseFloat(amount),
        buyerName,
        sellerName,
        dueDate,
        (prog) => setProgress(prog)
      );
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
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
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield color="#818cf8" size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Register Private Invoice</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Midnight `registerInvoice` ZK Circuit</p>
            </div>
          </div>
          {!isSubmitting && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                Invoice Amount ($ USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="glass-input"
                placeholder="50000"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="glass-input"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
              Buyer Corporate Entity Name (Private)
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={e => setBuyerName(e.target.value)}
              className="glass-input"
              placeholder="e.g. Acme Global Industries"
              required
              disabled={isSubmitting}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
              Seller MSME Entity Name (Private)
            </label>
            <input
              type="text"
              value={sellerName}
              onChange={e => setSellerName(e.target.value)}
              className="glass-input"
              placeholder="e.g. TechSupplies LLC"
              required
              disabled={isSubmitting}
            />
          </div>

          <div style={{ marginBottom: '1.25rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cryptographic ZK Salt (256-bit)</span>
              <button
                type="button"
                onClick={() => setSalt(generateRandomSalt())}
                style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '0.7rem' }}
                disabled={isSubmitting}
              >
                Refresh Salt
              </button>
            </div>
            <p className="mono" style={{ fontSize: '0.75rem', color: '#818cf8', wordBreak: 'break-all' }}>{salt}</p>
          </div>

          {progress && (
            <div style={{ marginBottom: '1.25rem', background: 'rgba(99, 102, 241, 0.08)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Cpu size={16} color="#818cf8" className="pulse-active" />
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>{progress.message}</span>
              </div>
              <div className="zk-progress-bar">
                <div className="zk-progress-fill" style={{ width: `${progress.progressPercent}%` }}></div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Sparkles size={16} />
              {isSubmitting ? 'Generating ZK Proof...' : 'Register & Prove Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
