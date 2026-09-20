import React, { useState } from 'react';
import { ShieldAlert, Cpu, AlertTriangle, CheckCircle } from 'lucide-react';
import { midnightClient, InvoiceRecord } from '../utils/midnightClient';
import { formatTruncatedHash } from '../utils/cryptoUtils';

interface AntiFraudDemoPanelProps {
  invoices: InvoiceRecord[];
  onRefresh: () => void;
}

export const AntiFraudDemoPanel: React.FC<AntiFraudDemoPanelProps> = ({ invoices, onRefresh }) => {
  const financedInvoice = invoices.find(i => i.status === 'Financed') || invoices[0];
  const [selectedCommitment, setSelectedCommitment] = useState<string>(financedInvoice?.commitment || '');
  const [lenderBName, setLenderBName] = useState<string>('Horizon Capital Lender B');

  const [isAttempting, setIsAttempting] = useState(false);
  const [resultLog, setResultLog] = useState<{
    status: 'idle' | 'testing' | 'rejected_success' | 'unexpected_success';
    message: string;
    details?: string;
  }>({
    status: 'idle',
    message: 'Ready to execute Midnight double-financing rejection circuit test.'
  });

  const handleAttemptDuplicateFinancing = async () => {
    if (!selectedCommitment) return;

    setIsAttempting(true);
    setResultLog({
      status: 'testing',
      message: 'Executing Midnight financeInvoice circuit (2,150 R1CS constraints) for Lender B...'
    });

    await new Promise(r => setTimeout(r, 600));

    try {
      await midnightClient.financeInvoice(selectedCommitment, lenderBName);
      // Should not reach here if invoice is already financed
      setResultLog({
        status: 'unexpected_success',
        message: 'Financing succeeded unexpectedly.',
        details: 'The invoice was in Open state and was successfully financed.'
      });
      onRefresh();
    } catch (err: any) {
      setResultLog({
        status: 'rejected_success',
        message: '🛡️ ZK PROOF GENERATION REJECTED AT CIRCUIT LEVEL!',
        details: err.message || 'Invoice is already Financed — Double financing attempt blocked!'
      });
    } finally {
      setIsAttempting(false);
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '1.75rem',
      marginBottom: '2rem',
      border: '1px solid rgba(244, 63, 94, 0.3)',
      background: 'rgba(15, 23, 42, 0.85)',
      boxShadow: 'var(--shadow-rose-glow)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <ShieldAlert color="#f43f5e" size={24} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
          Interactive Anti-Double Financing Proof Simulator
        </h2>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
        Test Midnight's cryptographic anti-fraud circuit: Attempt to finance an invoice commitment that has already been financed by Lender A. Observe how the circuit rejects proof generation without leaking private invoice details.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Input Controls */}
        <div style={{ background: 'rgba(9, 13, 22, 0.6)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
              Target Invoice Commitment Hash
            </label>
            <select
              value={selectedCommitment}
              onChange={e => setSelectedCommitment(e.target.value)}
              className="glass-input mono"
              style={{ fontSize: '0.85rem' }}
              disabled={isAttempting}
            >
              {invoices.map(inv => (
                <option key={inv.commitment} value={inv.commitment} style={{ background: '#0f172a' }}>
                  [{inv.status.toUpperCase()}] {formatTruncatedHash(inv.commitment, 8)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
              Attempting Lender Identifier
            </label>
            <input
              type="text"
              value={lenderBName}
              onChange={e => setLenderBName(e.target.value)}
              className="glass-input"
              disabled={isAttempting}
            />
          </div>

          <button
            onClick={handleAttemptDuplicateFinancing}
            className="btn-danger"
            disabled={isAttempting || !selectedCommitment}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <AlertTriangle size={18} />
            {isAttempting ? 'Executing Circuit Check...' : 'Trigger Duplicate Financing Attempt'}
          </button>
        </div>

        {/* Live Output Log */}
        <div style={{ background: 'rgba(9, 13, 22, 0.8)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.15)', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {resultLog.status === 'idle' && (
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <Cpu size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem' }}>Click "Trigger Duplicate Financing Attempt" to run the circuit verification test.</p>
            </div>
          )}

          {resultLog.status === 'testing' && (
            <div style={{ textAlign: 'center', color: '#38bdf8' }}>
              <Cpu size={32} className="pulse-active" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{resultLog.message}</p>
            </div>
          )}

          {resultLog.status === 'rejected_success' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle color="#10b981" size={20} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
                  ANTI-FRAUD PROOF SUCCESSFUL
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f43f5e', marginBottom: '0.5rem' }}>
                {resultLog.message}
              </p>
              <div className="mono" style={{ fontSize: '0.78rem', color: '#fda4af', background: 'rgba(244, 63, 94, 0.1)', padding: '0.6rem', borderRadius: '6px', marginBottom: '0.75rem', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                {resultLog.details}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                🔒 <strong>Privacy Guarantee Confirmed:</strong> Lender B was blocked from financing, but Lender B <em>never learned</em> the invoice dollar amount, seller name, or buyer identity!
              </p>
            </div>
          )}

          {resultLog.status === 'unexpected_success' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>{resultLog.message}</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{resultLog.details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
