import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LaceWalletBar } from './components/LaceWalletBar';
import { RegisterInvoiceModal } from './components/RegisterInvoiceModal';
import { FinanceInvoiceModal } from './components/FinanceInvoiceModal';
import { SettleInvoiceModal } from './components/SettleInvoiceModal';
import { PrivacyComparisonPanel } from './components/PrivacyComparisonPanel';
import { AntiFraudDemoPanel } from './components/AntiFraudDemoPanel';
import { InvoiceRegistryTable } from './components/InvoiceRegistryTable';
import { LenderAnalyticsDashboard } from './components/LenderAnalyticsDashboard';
import { laceAdapter, LaceWalletState } from './utils/laceWallet';
import { midnightClient, InvoiceRecord } from './utils/midnightClient';
import { Shield, Sparkles, Lock, CheckCircle2, Zap, BarChart3, ListFilter, ShieldAlert } from 'lucide-react';

export default function App() {
  const [walletState, setWalletState] = useState<LaceWalletState>(laceAdapter.getState());
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(midnightClient.getInvoices());
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(invoices[0] || null);

  const [activeTab, setActiveTab] = useState<'registry' | 'analytics' | 'antifraud'>('registry');

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  useEffect(() => {
    const unsubWallet = laceAdapter.subscribe(state => setWalletState(state));
    const unsubMidnight = midnightClient.subscribe(() => {
      const updated = midnightClient.getInvoices();
      setInvoices(updated);
      if (selectedInvoice) {
        const found = updated.find(i => i.commitment === selectedInvoice.commitment);
        if (found) setSelectedInvoice(found);
      }
    });

    return () => {
      unsubWallet();
      unsubMidnight();
    };
  }, [selectedInvoice]);

  const handleRefresh = () => {
    setInvoices(midnightClient.getInvoices());
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        walletState={walletState}
        onConnectWallet={() => setShowWalletModal(true)}
        onOpenRegisterModal={() => setShowRegisterModal(true)}
        onOpenFinanceModal={() => setShowFinanceModal(true)}
        contractAddress={midnightClient.contractAddress}
        explorerUrl={midnightClient.explorerUrl}
      />

      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Hero Section */}
        <section style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.35rem 1rem', borderRadius: '9999px', fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '1rem' }}>
            <Sparkles size={14} color="#818cf8" />
            <span>Midnight Network Hackathon Project — Preprod Live Testnet</span>
          </div>

          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1rem', color: '#fff' }}>
            Privacy-Preserving Invoice Financing <br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Without Double-Financing Fraud
            </span>
          </h1>

          <p style={{ maxWidth: '760px', margin: '0 auto 1.75rem', color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6 }}>
            InvoiceChain uses <strong>Midnight Compact ZK circuits</strong> to cryptographically prove an invoice has not been financed elsewhere—<strong>without revealing invoice amounts, currencies, buyer identity, or seller identity on public ledger state.</strong>
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => setShowRegisterModal(true)} className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              <Shield size={18} /> Register Private Invoice
            </button>
            <button onClick={() => setShowFinanceModal(true)} className="btn-secondary" style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}>
              <Zap size={18} /> Finance / Fund Invoice
            </button>
          </div>
        </section>

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('registry')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              border: activeTab === 'registry' ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'registry' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'registry' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ListFilter size={16} /> Invoice Ledger & Actions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              border: activeTab === 'analytics' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'analytics' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'analytics' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BarChart3 size={16} color="#34d399" /> Lender Risk Analytics & Credit Score
          </button>
          <button
            onClick={() => setActiveTab('antifraud')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              border: activeTab === 'antifraud' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'antifraud' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'antifraud' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ShieldAlert size={16} color="#38bdf8" /> Anti-Fraud ZK Prover Simulator
          </button>
        </div>

        {activeTab === 'registry' && (
          <>
            {/* Observable Privacy Behavior Panel */}
            <PrivacyComparisonPanel invoice={selectedInvoice} />

            {/* Registered Invoices Ledger Table */}
            <InvoiceRegistryTable
              invoices={invoices}
              selectedCommitment={selectedInvoice?.commitment || null}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onOpenFinanceModal={() => setShowFinanceModal(true)}
              onOpenSettleModal={() => setShowSettleModal(true)}
              explorerUrl={midnightClient.explorerUrl}
            />
          </>
        )}

        {activeTab === 'analytics' && (
          <LenderAnalyticsDashboard invoices={invoices} />
        )}

        {activeTab === 'antifraud' && (
          <AntiFraudDemoPanel invoices={invoices} onRefresh={handleRefresh} />
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', background: 'rgba(9, 13, 22, 0.9)', padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
        <p>Built for Midnight Network — Compact Circuit Contract: <span className="mono" style={{ color: '#818cf8', wordBreak: 'break-all' }}>{midnightClient.contractAddress}</span></p>
      </footer>

      {/* Modals */}
      {showWalletModal && <LaceWalletBar walletState={walletState} onClose={() => setShowWalletModal(false)} />}
      {showRegisterModal && <RegisterInvoiceModal onClose={() => setShowRegisterModal(false)} onSuccess={handleRefresh} />}
      {showFinanceModal && <FinanceInvoiceModal invoices={invoices} onClose={() => setShowFinanceModal(false)} onSuccess={handleRefresh} />}
      {showSettleModal && <SettleInvoiceModal invoices={invoices} onClose={() => setShowSettleModal(false)} onSuccess={handleRefresh} />}
    </div>
  );
}

