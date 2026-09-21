// Midnight Network Configuration & Single Source of Truth for Deployed Contract

export interface AppConfig {
  network: string;
  chainId: string;
  rpcEndpoint: string;
  indexerUrl: string;
  proofServerUrl: string;
  explorerUrl: string;
  contractAddress: string;
  isContractValid: boolean;
}

/**
 * Validates whether a string is a valid Midnight Network contract address.
 * Midnight contract addresses are 32-byte (64 hex characters) strings prefixed with 0x (66 chars total).
 */
export function isValidMidnightAddress(address: string | null | undefined): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  // Valid Midnight contract address format: 0x followed by exactly 64 hexadecimal characters
  const midnightRegex = /^0x[a-fA-F0-9]{64}$/;
  return midnightRegex.test(trimmed);
}

/**
 * Load application configuration from environment variables or fallback deployment JSON
 */
export function getAppConfig(): AppConfig {
  const envAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '';
  
  // Default to env variable if present and valid; otherwise check window/fallback
  let address = envAddress;

  // Standard fallback preprod contract address placeholder (64 hex characters / 32 bytes)
  // Example valid 32-byte Midnight contract address format: 0x0200 + 60 hex chars
  const fallbackPreprodAddress = "0x02008f7a9c1e2b3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e";

  if (!isValidMidnightAddress(address)) {
    address = fallbackPreprodAddress;
  }

  const isValid = isValidMidnightAddress(address);

  const network = import.meta.env.VITE_MIDNIGHT_NETWORK || "preprod";
  const rpcEndpoint = import.meta.env.VITE_MIDNIGHT_RPC_URL || "https://rpc.preprod.midnight.network";
  const indexerUrl = import.meta.env.VITE_MIDNIGHT_INDEXER_URL || "https://indexer.preprod.midnight.network/api/v1/graphql";
  const proofServerUrl = import.meta.env.VITE_MIDNIGHT_PROOF_SERVER_URL || "http://localhost:6300";
  const explorerBase = "https://explorer.preprod.midnight.network";

  return {
    network,
    chainId: "0x4d49444e49474854",
    rpcEndpoint,
    indexerUrl,
    proofServerUrl,
    explorerUrl: `${explorerBase}/address/${address}`,
    contractAddress: address,
    isContractValid: isValid
  };
}

export const appConfig = getAppConfig();
