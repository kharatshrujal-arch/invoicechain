import React from 'react';
import { Shield, ExternalLink, Wallet, CheckCircle2, Lock } from 'lucide-react';
import { LaceWalletState } from '../utils/laceWallet';
import { formatTruncatedHash } from '../utils/cryptoUtils';

interface NavbarProps {
  walletState: LaceWalletState;
  onConnectWallet: () => void;
  onOpenRegisterModal: () => void;
  onOpenFinanceModal: () => void;
  contractAddress: string;
  explorerUrl: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  walletState,
  onConnectWallet,
  onOpenRegisterModal,
  onOpenFinanceModal,
  contractAddress,
  explorerUrl
}) => {
  return (
    <nav style={{
      borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '1rem 2rem'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                Invoice<span style={{ color: '#818cf8' }}>Chain</span>
              </span>
              <span className="badge badge-open" style={{ fontSize: '0.65rem' }}>
                Midnight Preprod
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Zero-Knowledge Invoice Financing dApp
            </p>
          </div>
        </div>

        {/* Center Contract Link */}
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#cbd5e1',
            textDecoration: 'none',
            fontSize: '0.8rem'
          }}
        >
          <Lock size={12} color="#818cf8" />
          <span className="mono">Contract: {formatTruncatedHash(contractAddress, 6)}</span>
          <ExternalLink size={12} />
        </a>

        {/* Right Actions & Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onOpenRegisterModal} className="btn-secondary">
            Register Invoice
          </button>
          
          <button onClick={onOpenFinanceModal} className="btn-secondary" style={{ borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}>
            Finance Invoice
          </button>

          {walletState.isConnected ? (
            <button
              onClick={onConnectWallet}
              className="btn-secondary"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                color: '#34d399'
              }}
            >
              <CheckCircle2 size={16} />
              <span className="mono">{formatTruncatedHash(walletState.address || '', 4)}</span>
            </button>
          ) : (
            <button
              onClick={onConnectWallet}
              className="btn-primary"
              disabled={walletState.isConnecting}
            >
              <Wallet size={16} />
              {walletState.isConnecting ? 'Connecting Lace...' : 'Connect Lace Wallet'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
