"use client";

import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { EthersExtension } from "@dynamic-labs/ethers-v6";
import {
  WagmiProvider,
  createConfig,
  http,
  useTransaction,
  useWriteContract,
} from "wagmi";
import { mainnet, polygon, polygonMumbai } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useEffect, useMemo, useState } from "react";
import type { Account, Chain, Client, Transport } from "viem";
import { type Config, useConnectorClient } from "wagmi";

function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}

const config = createConfig({
  chains: [mainnet, polygon, polygonMumbai],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [polygonMumbai.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function Home() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: "8147e03d-fea6-4336-afb6-3eb7df92c7df",
        walletConnectorExtensions: [EthersExtension],
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <DynamicWidget />
            <ContractWriteSection />
            <EthersSignerSection />
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}

function ContractWriteSection() {
  const { writeContract, data, isPending } = useWriteContract();

  const { isSuccess } = useTransaction({
    hash: data,
  });

  return (
    <div>
      <button
        disabled={!writeContract || isPending}
        onClick={() =>
          writeContract?.({
            abi: [
              {
                inputs: [],
                name: "mint",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
              },
            ] as const,
            address: "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
            functionName: "mint",
          })
        }
      >
        {isPending ? "Minting..." : "Mint Free NFT"}
      </button>
      {isSuccess && (
        <div>
          <p>Successfully minted your NFT!</p>
          <p>Transaction hash: {data}</p>
        </div>
      )}
    </div>
  );
}

function EthersSignerSection() {
  const signer = useEthersSigner();
  const [hash, setHash] = useState<string | null>(null);

  const handleClick = async () => {
    if (!signer) return;
    const tx = await signer.sendTransaction({
      to: "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
      data: "0x",
    });
    setHash(tx.hash);
  };

  return (
    <div>
      <button disabled={!signer} onClick={handleClick}>
        {"Mint Using Ethers Signer"}
      </button>
      {hash && (
        <div>
          <p>Successfully minted your NFT!</p>
          <p>Transaction hash: {hash}</p>
        </div>
      )}
    </div>
  );
}
