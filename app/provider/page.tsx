"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ProviderDashboard } from "@/components/provider-dashboard";
import { WalletMinimal } from "lucide-react";

export default function ProviderPage() {
  const { publicKey, connected } = useWallet();

  if (!connected || !publicKey) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-12 text-center backdrop-blur-sm">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-zinc-700/50">
              <WalletMinimal className="h-8 w-8 text-zinc-400" />
            </div>

            <h2 className="heading-md mb-3">Connect Your Wallet</h2>
            <p className="body-md text-zinc-400 leading-relaxed">
              Connect your Solana wallet to access the provider dashboard and
              view your service statistics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="heading-xl mb-3">Provider Dashboard</h1>
        <p className="body-lg text-zinc-400">
          Monitor your services, earnings, and performance metrics
        </p>
      </div>

      <ProviderDashboard walletAddress={publicKey.toBase58()} />
    </div>
  );
}
