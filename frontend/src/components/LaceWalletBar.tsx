import React from 'react';
import { Wallet, CheckCircle, LogOut, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { LaceWalletState, laceAdapter } from '../utils/laceWallet';
import { formatTruncatedHash } from '../utils/cryptoUtils';

interface LaceWalletBarProps {
  walletState: LaceWalletState;
  onClose: () => void;
}

export const LaceWalletBar: React.FC<LaceWalletBarProps> = ({ walletState, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 9, 19, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet color="#818cf8" size={20} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Lace Wallet Connection</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {walletState.isConnected ? (
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle color="#34d399" size={16} />
                <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>Connected to Midnight Network</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>Network: <strong style={{ color: '#f8fafc' }}>{walletState.network}</strong></p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.8)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <span className="mono" style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{formatTruncatedHash(walletState.address || '', 8)}</span>
                <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}>
                  <Copy size={12} /> {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid rgba(148, 163, 184, 0.1)', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Wallet Balance</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#06b6d4' }}>{walletState.balance}</span>
            </div>

            <button
              onClick={() => {
                laceAdapter.disconnect();
                onClose();
              }}
              className="btn-danger"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <LogOut size={16} /> Disconnect Lace Wallet
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Connect your **Lace Wallet** to interact with Midnight Compact ZK circuits and submit invoice financing proofs to the Preprod testnet.
            </p>
            <button
              onClick={async () => {
                await laceAdapter.connect();
                onClose();
              }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <ShieldCheck size={18} /> Connect Lace Wallet Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
