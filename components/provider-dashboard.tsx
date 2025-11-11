"use client";

import { useState, useEffect } from "react";
import type { ProviderStats, Transaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUSDC, formatDate, formatPercentage } from "@/lib/utils";
import { TrendingUp, Zap, DollarSign, Activity, Copy } from "lucide-react";
import { toast } from "sonner";
import { mockQuery } from "@/lib/mock-data";

interface ProviderDashboardProps {
  walletAddress: string;
}

export function ProviderDashboard({ walletAddress }: ProviderDashboardProps) {
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const servicesResponse = await fetch("/api/services");
        const servicesData = await servicesResponse.json();
        const services = Array.isArray(servicesData.services)
          ? servicesData.services
          : [];
        const provider = services[0];

        if (provider) {
          const statsResponse = await fetch(
            `/api/provider/stats?providerId=${provider.id}`
          );
          const statsData = await statsResponse.json();

          setStats({
            totalRequests: statsData.stats.totalRequests,
            successRate: statsData.stats.successRate,
            totalEarnings: statsData.stats.totalEarnings,
            averageResponseTime: 2.5,
            activeServices: 1,
            totalServices: 1,
          });

          setTransactions(
            statsData.recentRequests.map((req: any) => ({
              id: req.id,
              signature: "mock-tx-" + req.id.substring(0, 8),
              serviceId: provider.id,
              serviceName: provider.name,
              amount: req.cost,
              status: req.status === "completed" ? "confirmed" : req.status,
              timestamp: new Date(req.createdAt),
              userWallet: req.userWallet,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch provider data:", error);
        setStats(mockQuery.providerStats);
        setTransactions(mockQuery.recentTransactions);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Stats Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6"
            >
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-10 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid - Bento Style */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Requests */}
        <div className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="caption text-zinc-500">Total Requests</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/50 ring-1 ring-zinc-700/50">
              <TrendingUp className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-white">
              {stats?.totalRequests.toLocaleString()}
            </div>
            <p className="body-sm text-zinc-500">
              Across {stats?.totalServices}{" "}
              {stats?.totalServices === 1 ? "service" : "services"}
            </p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="caption text-zinc-500">Success Rate</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-emerald-400">
              {stats && formatPercentage(stats.successRate)}
            </div>
            <p className="body-sm text-zinc-500">
              {stats?.activeServices} active{" "}
              {stats?.activeServices === 1 ? "service" : "services"}
            </p>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="caption text-zinc-500">Total Earnings</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20">
              <DollarSign className="h-4 w-4 text-violet-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-violet-400">
              {stats && formatUSDC(stats.totalEarnings)}
            </div>
            <p className="body-sm text-zinc-500">All-time revenue</p>
          </div>
        </div>

        {/* Average Response */}
        <div className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="caption text-zinc-500">Avg Response</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/50 ring-1 ring-zinc-700/50">
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-white">
              {stats?.averageResponseTime.toFixed(1)}s
            </div>
            <p className="body-sm text-zinc-500">Processing time</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-800/50">
          <h2 className="heading-md">Recent Transactions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="px-6 py-4 text-left caption text-zinc-500 font-medium">
                  Signature
                </th>
                <th className="px-6 py-4 text-left caption text-zinc-500 font-medium">
                  Service
                </th>
                <th className="px-6 py-4 text-left caption text-zinc-500 font-medium">
                  Amount
                </th>
                <th className="px-6 py-4 text-left caption text-zinc-500 font-medium">
                  Status
                </th>
                <th className="px-6 py-4 text-left caption text-zinc-500 font-medium">
                  Date
                </th>
                <th className="px-6 py-4 text-left caption text-zinc-500 font-medium">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="body-sm font-mono text-zinc-400 truncate max-w-[120px]">
                        {tx.signature}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(tx.signature)}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="body-sm text-white">{tx.serviceName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="body-sm font-semibold text-violet-400">
                      {formatUSDC(tx.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={getStatusVariant(tx.status)}
                      className="capitalize"
                    >
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="body-sm text-zinc-500">
                      {formatDate(tx.timestamp)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="body-sm font-mono text-zinc-500">
                      {tx.userWallet}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="p-12 text-center">
            <p className="body-md text-zinc-500">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
