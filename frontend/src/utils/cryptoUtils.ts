// ZK Crypto Utilities for InvoiceChain on Midnight Network

export function generateRandomSalt(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return '0x' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeInvoiceCommitment(
  amount: number,
  buyerId: string,
  sellerId: string,
  dueDate: string,
  salt: string
): Promise<string> {
  const payload = `INVOICE_CHAIN_V1:${amount}:${buyerId}:${sellerId}:${dueDate}:${salt}`;
  return hashSha256(payload);
}

export function formatTruncatedHash(hash: string, chars = 6): string {
  if (!hash) return '';
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.substring(0, chars + 2)}...${hash.substring(hash.length - chars)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}
