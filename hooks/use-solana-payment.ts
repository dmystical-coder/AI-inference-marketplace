'use client';

import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'sonner';

interface PaymentParams {
  amount: number; // in SOL
  recipient: string; // recipient wallet address
  description?: string;
}

interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export function useSolanaPayment() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const sendPayment = useCallback(
    async ({ amount, recipient, description }: PaymentParams): Promise<PaymentResult> => {
      if (!connected || !publicKey) {
        return {
          success: false,
          error: 'Wallet not connected',
        };
      }

      setIsProcessing(true);

      try {
        // Validate recipient address
        let recipientPubKey: PublicKey;
        try {
          recipientPubKey = new PublicKey(recipient);
        } catch (err) {
          throw new Error('Invalid recipient wallet address');
        }

        // Check balance
        const balance = await connection.getBalance(publicKey);
        const requiredLamports = Math.floor(amount * LAMPORTS_PER_SOL);
        
        if (balance < requiredLamports) {
          throw new Error(`Insufficient balance. Required: ${amount} SOL, Available: ${balance / LAMPORTS_PER_SOL} SOL`);
        }

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create transaction
        const transaction = new Transaction({
          feePayer: publicKey,
          blockhash,
          lastValidBlockHeight,
        }).add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubKey,
            lamports: requiredLamports,
          })
        );

        // Add memo if description provided
        if (description) {
          // Note: Would need to add @solana/spl-memo for this
          // For now, we'll skip the memo
        }

        // Send transaction
        toast.info('Please approve the transaction in your wallet');
        
        const signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });

        toast.info('Transaction sent! Waiting for confirmation...');

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          'confirmed'
        );

        if (confirmation.value.err) {
          throw new Error('Transaction failed to confirm');
        }

        toast.success('Payment confirmed!');

        return {
          success: true,
          signature,
        };
      } catch (err: any) {
        console.error('Payment error:', err);

        let errorMessage = 'Payment failed';
        if (err.message?.includes('User rejected')) {
          errorMessage = 'Transaction cancelled by user';
        } else if (err.message?.includes('insufficient')) {
          errorMessage = err.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        toast.error(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [connection, publicKey, sendTransaction, connected]
  );

  const checkBalance = useCallback(async (): Promise<number | null> => {
    if (!connected || !publicKey) {
      return null;
    }

    try {
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (err) {
      console.error('Error checking balance:', err);
      return null;
    }
  }, [connection, publicKey, connected]);

  return {
    sendPayment,
    checkBalance,
    isProcessing,
    connected,
    walletAddress: publicKey?.toBase58() || null,
  };
}

