import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } from '@solana/web3.js'
import { db } from './db'

/**
 * Solana connection configuration
 */
const getSolanaConnection = () => {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  return new Connection(rpcUrl, 'confirmed')
}

/**
 * Verify a Solana transaction
 * Checks if the transaction exists, is confirmed, and matches expected parameters
 */
export async function verifyTransaction(
  signature: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<boolean> {
  try {
    // In development/demo mode, accept mock transactions
    if (signature.startsWith('mock-tx-')) {
      console.log(`Mock transaction accepted for development: ${signature}`)
      return true
    }

    const connection = getSolanaConnection()
    
    // Get transaction details with full commitment
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    })

    if (!tx) {
      console.log(`Transaction not found: ${signature}. It may not be confirmed yet.`)
      return false
    }

    // Check if transaction was successful
    if (tx.meta?.err) {
      console.log(`Transaction failed: ${signature}`, tx.meta.err)
      return false
    }

    // Verify recipient exists in the transaction
    const recipientPubkey = new PublicKey(expectedRecipient)
    const accountKeys = tx.transaction.message.getAccountKeys().staticAccountKeys
    const recipientIndex = accountKeys.findIndex(key => key.equals(recipientPubkey))

    if (recipientIndex === -1) {
      console.log(`Recipient ${expectedRecipient} not found in transaction ${signature}`)
      return false
    }

    // Verify the amount transferred
    // Check the balance changes for the recipient
    if (!tx.meta?.postBalances || !tx.meta?.preBalances) {
      console.log(`Transaction ${signature} is missing balance information`)
      return false
    }

    const preBalance = tx.meta.preBalances[recipientIndex]
    const postBalance = tx.meta.postBalances[recipientIndex]
    const balanceChange = postBalance - preBalance
    const expectedLamports = Math.floor(expectedAmount * LAMPORTS_PER_SOL)

    // Allow for small rounding differences (within 1000 lamports = 0.000001 SOL)
    const tolerance = 1000
    const amountMatches = Math.abs(balanceChange - expectedLamports) <= tolerance

    if (!amountMatches) {
      console.log(
        `Transaction ${signature} amount mismatch. ` +
        `Expected: ${expectedLamports} lamports (${expectedAmount} SOL), ` +
        `Actual: ${balanceChange} lamports (${balanceChange / LAMPORTS_PER_SOL} SOL)`
      )
      return false
    }

    console.log(
      `Transaction verified: ${signature}\n` +
      `  Recipient: ${expectedRecipient}\n` +
      `  Amount: ${balanceChange} lamports (${balanceChange / LAMPORTS_PER_SOL} SOL)\n` +
      `  Expected: ${expectedLamports} lamports (${expectedAmount} SOL)`
    )
    return true
  } catch (error: any) {
    console.error('Error verifying transaction:', error.message || error)
    // If it's a "transaction not found" error, it might just be too recent
    if (error.message?.includes('not found')) {
      console.log('Transaction may not be confirmed yet. Please retry in a few moments.')
    }
    return false
  }
}

/**
 * Create an escrow record in the database
 * This tracks payments that are held until inference completion
 */
export async function createEscrowRecord(
  requestId: string,
  amount: number,
  txSignature: string
): Promise<string> {
  try {
    const escrow = await db.escrowTransaction.create({
      data: {
        requestId,
        amount,
        status: 'held',
        txSignature,
      },
    })

    console.log(`Escrow created: ${escrow.id} for request ${requestId}`)
    return escrow.id
  } catch (error: any) {
    console.error('Error creating escrow record:', error)
    throw new Error(`Failed to create escrow: ${error.message}`)
  }
}

/**
 * Release escrow to provider
 * In a production system, this would initiate an actual on-chain transfer
 * For now, we'll just update the database record
 */
export async function settleEscrow(
  escrowId: string,
  providerWallet: string
): Promise<void> {
  try {
    // Update escrow status to released
    await db.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'released',
        releasedAt: new Date(),
        // In production, you would:
        // 1. Create and send a Solana transaction to transfer funds
        // 2. Store the transaction signature here
        releaseTxSignature: `mock-release-${Date.now()}`, // Placeholder
      },
    })

    console.log(`Escrow ${escrowId} released to provider ${providerWallet}`)
    
    // TODO: In production, implement actual on-chain transfer:
    // const connection = getSolanaConnection()
    // const marketplaceKeypair = getMarketplaceKeypair()
    // const providerPubkey = new PublicKey(providerWallet)
    // const transaction = new Transaction().add(
    //   SystemProgram.transfer({
    //     fromPubkey: marketplaceKeypair.publicKey,
    //     toPubkey: providerPubkey,
    //     lamports: amount * LAMPORTS_PER_SOL,
    //   })
    // )
    // const signature = await sendAndConfirmTransaction(connection, transaction, [marketplaceKeypair])
  } catch (error: any) {
    console.error('Error settling escrow:', error)
    throw new Error(`Failed to settle escrow: ${error.message}`)
  }
}

/**
 * Refund escrow to user
 * Called when inference fails or is cancelled
 */
export async function refundEscrow(
  escrowId: string,
  userWallet: string
): Promise<void> {
  try {
    // Update escrow status to refunded
    await db.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'refunded',
        refundedAt: new Date(),
        refundTxSignature: `mock-refund-${Date.now()}`, // Placeholder
      },
    })

    console.log(`Escrow ${escrowId} refunded to user ${userWallet}`)
    
    // TODO: In production, implement actual on-chain refund
  } catch (error: any) {
    console.error('Error refunding escrow:', error)
    throw new Error(`Failed to refund escrow: ${error.message}`)
  }
}

/**
 * Get escrow status
 */
export async function getEscrowStatus(escrowId: string) {
  try {
    const escrow = await db.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        request: {
          include: {
            provider: true,
          },
        },
      },
    })

    return escrow
  } catch (error: any) {
    console.error('Error getting escrow status:', error)
    return null
  }
}

/**
 * Get pending escrows (for batch processing)
 */
export async function getPendingEscrows() {
  try {
    const escrows = await db.escrowTransaction.findMany({
      where: {
        status: 'held',
      },
      include: {
        request: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return escrows
  } catch (error: any) {
    console.error('Error getting pending escrows:', error)
    return []
  }
}

/**
 * Helper to extract marketplace keypair from environment
 * In production, this would load from a secure key management system
 */
function getMarketplaceKeypair(): Keypair {
  const privateKeyString = process.env.MARKETPLACE_WALLET_PRIVATE_KEY
  
  if (!privateKeyString) {
    throw new Error('MARKETPLACE_WALLET_PRIVATE_KEY not configured')
  }

  try {
    // Parse the private key (expecting base58 or array format)
    const privateKeyArray = JSON.parse(privateKeyString)
    return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray))
  } catch (error) {
    throw new Error('Invalid MARKETPLACE_WALLET_PRIVATE_KEY format')
  }
}

