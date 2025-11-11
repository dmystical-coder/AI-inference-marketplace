"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (signature: string) => void;
  serviceId: string;
  serviceName: string;
  price: number;
  providerWallet: string;
}

type PaymentStatus =
  | "idle"
  | "connecting"
  | "confirming"
  | "processing"
  | "success"
  | "error";

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  serviceId,
  serviceName,
  price,
  providerWallet,
}: PaymentModalProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string>("");
  const [txSignature, setTxSignature] = useState<string>("");

  const handlePayment = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setStatus("connecting");
      setError("");

      console.log("Starting payment process...", {
        publicKey: publicKey.toBase58(),
        providerWallet,
        price,
      });

      // Validate provider wallet address
      let providerPubKey: PublicKey;
      try {
        providerPubKey = new PublicKey(providerWallet);
      } catch (err) {
        throw new Error("Invalid provider wallet address");
      }

      // Test connection health
      try {
        const version = await connection.getVersion();
        console.log("RPC connection healthy:", version);
      } catch (connErr) {
        console.error("RPC connection issue:", connErr);
        throw new Error(
          "Unable to connect to Solana network. Please check your connection."
        );
      }

      // Check balance first
      setStatus("confirming");
      const balance = await connection.getBalance(publicKey);
      const requiredLamports = Math.floor(price * LAMPORTS_PER_SOL);
      const estimatedFee = 5000; // 0.000005 SOL estimated fee

      console.log("Balance check:", {
        balance: balance / LAMPORTS_PER_SOL,
        required: price,
        requiredLamports,
      });

      if (balance < requiredLamports + estimatedFee) {
        throw new Error(
          `Insufficient balance. Required: ${price} SOL + fees, Available: ${(
            balance / LAMPORTS_PER_SOL
          ).toFixed(4)} SOL`
        );
      }

      // Get recent blockhash with confirmed commitment (finalized can be slow)
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      console.log("Got blockhash:", { blockhash, lastValidBlockHeight });

      // Create transaction with proper configuration
      const transaction = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      });

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: providerPubKey,
          lamports: requiredLamports,
        })
      );

      console.log("Transaction created:", {
        instructions: transaction.instructions.length,
        feePayer: transaction.feePayer?.toBase58(),
      });

      // Send transaction with retry logic
      setStatus("processing");
      toast.info("Please approve the transaction in your wallet");

      let signature: string;
      try {
        console.log("Calling sendTransaction...");
        signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        });
        console.log("Transaction sent:", signature);
      } catch (sendErr: any) {
        console.error("Send transaction error:", {
          name: sendErr.name,
          message: sendErr.message,
          code: sendErr.code,
          error: sendErr.error,
        });

        // Better error messages for common wallet errors
        if (
          sendErr.message?.includes("User rejected") ||
          sendErr.code === 4001
        ) {
          throw new Error("Transaction cancelled by user");
        } else if (sendErr.message?.includes("Unexpected error")) {
          throw new Error(
            "Wallet error: Please ensure your wallet is unlocked and connected to Devnet"
          );
        } else if (sendErr.name === "WalletSendTransactionError") {
          throw new Error(
            `Wallet error: ${
              sendErr.message ||
              "Unable to send transaction. Please check your wallet connection."
            }`
          );
        }
        throw sendErr;
      }

      setTxSignature(signature);
      toast.info("Transaction sent! Waiting for confirmation...");

      // Wait for confirmation with timeout
      const confirmation = await Promise.race([
        connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        ),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Transaction confirmation timeout")),
            60000
          )
        ),
      ]);

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      console.log("Transaction confirmed successfully");
      setStatus("success");
      toast.success("Payment successful!");

      // Call the success callback with the signature
      setTimeout(() => {
        onPaymentSuccess(signature);
      }, 1000);
    } catch (err: any) {
      console.error("Payment error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
      setStatus("error");

      let errorMessage = "Payment failed";
      if (
        err.message?.includes("User rejected") ||
        err.message?.includes("cancelled")
      ) {
        errorMessage = "Transaction cancelled by user";
      } else if (err.message?.includes("Insufficient balance")) {
        errorMessage = err.message;
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Transaction timed out. Please check Solana Explorer.";
      } else if (err.message?.includes("Wallet error")) {
        errorMessage = err.message;
      } else if (err.message?.includes("connection")) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (status === "processing" || status === "confirming") {
      toast.warning("Please wait for the transaction to complete");
      return;
    }
    setStatus("idle");
    setError("");
    setTxSignature("");
    onClose();
  };

  const getStatusText = () => {
    switch (status) {
      case "connecting":
        return "Connecting to network...";
      case "confirming":
        return "Preparing transaction...";
      case "processing":
        return "Waiting for confirmation...";
      case "success":
        return "Payment successful!";
      case "error":
        return "Payment failed";
      default:
        return "Review and confirm payment";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader className="border-b border-zinc-800 pb-4">
          <DialogTitle className="text-xl font-semibold text-white">
            Complete Payment
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Pay with Solana to access {serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-6">
          {/* Status Text */}
          <div className="text-center">
            <p className="text-base font-medium text-white">
              {getStatusText()}
            </p>
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          </div>

          {/* Payment Details */}
          {status === "idle" && (
            <div className="space-y-3 bg-zinc-800/50 rounded-lg p-4 border border-zinc-800">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-500 uppercase tracking-wider">
                  Service
                </span>
                <span className="font-medium text-white">{serviceName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-zinc-800/50">
                <span className="text-sm text-zinc-500 uppercase tracking-wider">
                  Price
                </span>
                <span className="font-medium text-white">{price} SOL</span>
              </div>
              <div className="border-t border-zinc-700 pt-3 mt-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Total</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                    {price} SOL
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {(status === "connecting" ||
            status === "confirming" ||
            status === "processing") && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-violet-400 animate-spin mb-4" />
              <p className="text-sm text-zinc-400">
                This may take a few moments
              </p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <Check className="w-12 h-12 text-emerald-400 mb-3" />
              <p className="text-sm text-emerald-300 text-center">
                Transaction confirmed successfully
              </p>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
              <p className="text-sm text-red-300 text-center">
                Please try again or contact support
              </p>
            </div>
          )}

          {/* Transaction Signature */}
          {txSignature && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Transaction Signature
              </p>
              <div className="bg-zinc-800 rounded-lg p-3 break-all text-xs font-mono text-zinc-300 border border-zinc-700">
                {txSignature}
              </div>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-violet-400 hover:text-violet-300 hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                View on Solana Explorer →
              </a>
            </div>
          )}

          {/* Wallet Connection Warning */}
          {!connected && status === "idle" && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-300 mb-1">
                  Wallet not connected
                </p>
                <p className="text-zinc-400">
                  Please connect your wallet using the button in the top-right
                  corner
                </p>
              </div>
            </div>
          )}

          {/* Devnet Info */}
          {connected && status === "idle" && (
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-300 mb-1">
                  Using Solana Devnet
                </p>
                <p className="text-zinc-400 mb-2">
                  Make sure your wallet is connected to Devnet. Need test SOL?
                </p>
                <a
                  href="https://faucet.solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  Get free Devnet SOL →
                </a>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-zinc-800 pt-4">
          {status === "idle" && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!connected}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-violet-600 disabled:hover:to-purple-600 cursor-pointer"
              >
                Pay {price} SOL
              </button>
            </>
          )}
          {status === "success" && (
            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-200 cursor-pointer"
            >
              Continue
            </button>
          )}
          {status === "error" && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!connected}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Try Again
              </button>
            </>
          )}
          {(status === "connecting" ||
            status === "confirming" ||
            status === "processing") && (
            <button
              disabled
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 text-zinc-400 font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
