import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ServiceCategory, TransactionStatus, PaymentStatus, InferenceStatus } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatWalletAddress = (address: string): string => {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const formatUSDC = (amount: number): string => {
  return `${amount.toFixed(2)} USDC`;
};

export const formatSOL = (amount: number): string => {
  return `${amount.toFixed(4)} SOL`;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatCategory = (category: ServiceCategory): string => {
  return category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const formatStatus = (status: TransactionStatus | PaymentStatus | InferenceStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};
