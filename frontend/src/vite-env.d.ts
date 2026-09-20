/// <reference types="vite/client" />

interface Window {
  midnight?: {
    mnLace?: {
      apiVersion: string;
      name: string;
      icon: string;
      enable: () => Promise<{
        getAddress: () => Promise<string>;
        getNetwork: () => Promise<string>;
        getBalance: () => Promise<bigint>;
        signTransaction: (tx: any) => Promise<any>;
        submitTransaction: (signedTx: any) => Promise<string>;
      }>;
      isEnabled: () => Promise<boolean>;
    };
  };
}
