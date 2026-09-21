import React, { useState } from 'react';
import {
  Award,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Activity,
  ArrowRightLeft,
  PieChart,
  Percent,
  Calendar,
  AlertTriangle,
  Zap,
  Layers
} from 'lucide-react';
import {
  SUPPORTED_CURRENCIES,
  CurrencyCode,
  convertCurrency,
  formatCurrency,
  getExchangeRatePair
} from '../utils/currencyConverter';
import { InvoiceRecord } from '../utils/midnightClient';

interface Props {
  invoices: InvoiceRecord[];
}

export const LenderAnalyticsDashboard: React.FC<Props> = ({ invoices }) => {
  // Stress Test State
  const [allocationAmount, setAllocationAmount] = useState<number>(50000);
  const [discountRate, setDiscountRate] = useState<number>(8.5); // % yield
  const [stressDefaultRate, setStressDefaultRate] = useState<number>(0.5); // % default assumption

  // Currency Converter State
  const [calcAmount, setCalcAmount] = useState<number>(10000);
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('tDUST');

  // Compute portfolio metrics
  const totalFundedUsd = invoices.reduce((acc, inv) => {
    const amount = inv.fundedAmount || (inv.status === 'Financed' || inv.status === 'Settled' ? inv.witness.invoiceAmount : 0);
    return acc + convertCurrency(amount, inv.witness.currencyCode || 'USD', 'USD');
  }, 0);

  const activeInvoicesCount = invoices.filter(i => i.status === 'Financed' || i.status === 'PartiallyFinanced').length;
  const totalInvoicesCount = invoices.length;

  // Simulator calculations
  const grossReturn = allocationAmount * (discountRate / 100);
  const expectedDefaultLoss = allocationAmount * (stressDefaultRate / 100);
  const netProfit = Math.max(0, grossReturn - expectedDefaultLoss);
  const netRoi = ((netProfit / allocationAmount) * 100).toFixed(2);

  // Currency converter output
  const convertedCalcValue = convertCurrency(calcAmount, fromCurrency, toCurrency);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner: Credit Score & Key Indicators */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Credit Score Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '120px',
              height: '120px',
              background: 'radial-gradient(circle, rgba(129, 140, 248, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Lender Credit Score
              </span>
              <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff', margin: '0.25rem 0' }}>
                820 <span style={{ fontSize: '1rem', color: '#34d399', fontWeight: 600 }}>AAA</span>
              </h3>
            </div>
            <div style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '12px', padding: '0.65rem' }}>
              <Award size={24} color="#34d399" />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', height: '8px', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <div style={{ width: '88%', height: '100%', background: 'linear-gradient(90deg, #34d399, #38bdf8)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8' }}>
            <span>Low Risk Profile</span>
            <span>Top 2% Institutional Lenders</span>
          </div>
        </div>

        {/* Total Funded Exposure */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Total Funded Portfolio
              </span>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8', margin: '0.25rem 0' }}>
                ${totalFundedUsd.toLocaleString()} USD
              </h3>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '0.65rem' }}>
              <DollarSign size={24} color="#38bdf8" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Active Positions:</span> <strong>{activeInvoicesCount}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Total Invoices:</span> <strong>{totalInvoicesCount}</strong>
            </div>
          </div>
        </div>

        {/* Expected Yield APY */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Target Annual Yield (APY)
              </span>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24', margin: '0.25rem 0' }}>
                14.85% <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>+2.4% vs benchmark</span>
              </h3>
            </div>
            <div style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px', padding: '0.65rem' }}>
              <TrendingUp size={24} color="#fbbf24" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Avg Tenure:</span> <strong>45 Days</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Default Rate:</span> <strong style={{ color: '#34d399' }}>0.12%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Stress Simulator & Currency Converter */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Risk Stress Test & Yield Simulator */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.75rem',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Activity color="#818cf8" size={22} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Yield & Risk Stress Simulator
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Slider 1: Allocation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#cbd5e1' }}>
                <span>Liquidity Allocation ($ USD):</span>
                <strong style={{ color: '#818cf8' }}>${allocationAmount.toLocaleString()}</strong>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={allocationAmount}
                onChange={e => setAllocationAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#818cf8' }}
              />
            </div>

            {/* Slider 2: Discount Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#cbd5e1' }}>
                <span>Financing APR / Yield (%):</span>
                <strong style={{ color: '#fbbf24' }}>{discountRate}%</strong>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="0.5"
                value={discountRate}
                onChange={e => setDiscountRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24' }}
              />
            </div>

            {/* Slider 3: Stress Default Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#cbd5e1' }}>
                <span>Stress Scenario Default Rate (%):</span>
                <strong style={{ color: '#f87171' }}>{stressDefaultRate}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={stressDefaultRate}
                onChange={e => setStressDefaultRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f87171' }}
              />
            </div>

            {/* Results Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginTop: '0.5rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Projected Net Profit</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
                  +${Math.round(netProfit).toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Risk-Adjusted ROI</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                  {netRoi}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Multi-Currency Converter */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.75rem',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <ArrowRightLeft color="#38bdf8" size={22} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Multi-Currency ZK Settlement Calculator
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                Invoice Base Value
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={e => setCalcAmount(Number(e.target.value))}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
                <select
                  value={fromCurrency}
                  onChange={e => setFromCurrency(e.target.value as CurrencyCode)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#fff',
                    fontWeight: 600
                  }}
                >
                  {Object.values(SUPPORTED_CURRENCIES).map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                Equivalent Settlement Target Currency
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#38bdf8',
                    fontSize: '1.15rem',
                    fontWeight: 700
                  }}
                >
                  {formatCurrency(convertedCalcValue, toCurrency)}
                </div>
                <select
                  value={toCurrency}
                  onChange={e => setToCurrency(e.target.value as CurrencyCode)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#fff',
                    fontWeight: 600
                  }}
                >
                  {Object.values(SUPPORTED_CURRENCIES).map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>Reference Exchange Rate:</span>
              <strong style={{ color: '#cbd5e1' }}>{getExchangeRatePair(fromCurrency, toCurrency)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
