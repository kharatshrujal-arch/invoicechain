// Multi-Currency Engine & Exchange Rate Utilities

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AED' | 'tDUST';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  usdRate: number; // Rate relative to 1 USD
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', usdRate: 1.0, flag: '🇺🇸' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', usdRate: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', usdRate: 0.78, flag: '🇬🇧' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', usdRate: 155.20, flag: '🇯🇵' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', usdRate: 3.67, flag: '🇦🇪' },
  tDUST: { code: 'tDUST', name: 'Midnight DUST Token', symbol: 'tDUST', usdRate: 2.50, flag: '🌌' },
};

/**
 * Convert an amount from one currency to another using reference rates.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const fromConfig = SUPPORTED_CURRENCIES[from] || SUPPORTED_CURRENCIES.USD;
  const toConfig = SUPPORTED_CURRENCIES[to] || SUPPORTED_CURRENCIES.USD;

  // Convert to USD first, then to target currency
  const usdValue = amount / fromConfig.usdRate;
  const converted = usdValue * toConfig.usdRate;
  return Number(converted.toFixed(2));
}

/**
 * Format currency with symbol and localized grouping
 */
export function formatCurrency(amount: number, code: CurrencyCode = 'USD'): string {
  const config = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;
  const formattedNum = amount.toLocaleString('en-US', {
    minimumFractionDigits: code === 'JPY' ? 0 : 2,
    maximumFractionDigits: code === 'JPY' ? 0 : 2,
  });

  if (code === 'tDUST') {
    return `${formattedNum} tDUST`;
  }
  return `${config.symbol}${formattedNum}`;
}

/**
 * Get display string for exchange rate pair (e.g. 1 USD = 0.92 EUR)
 */
export function getExchangeRatePair(from: CurrencyCode, to: CurrencyCode): string {
  const rate = convertCurrency(1, from, to);
  const fromConfig = SUPPORTED_CURRENCIES[from];
  const toConfig = SUPPORTED_CURRENCIES[to];
  return `1 ${fromConfig.code} = ${rate} ${toConfig.code}`;
}
