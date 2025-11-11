import { db } from './db'
import { routeToProvider } from './provider-proxy'
import { verifyTransaction, createEscrowRecord, settleEscrow, refundEscrow } from './solana-escrow'

/**
 * Inference Result Type
 */
export interface InferenceResult {
  requestId: string
  providerId: string
  providerName: string
  input: string
  output: string
  status: string
  cost: number
  processingTime: number
  timestamp: Date
}

/**
 * Submit Inference Request
 * Main function to handle inference submission with payment verification and escrow
 */
export async function submitInference(params: {
  serviceId: string
  input: string
  userWallet: string
  paymentTxSignature: string
}): Promise<InferenceResult> {
  const { serviceId, input, userWallet, paymentTxSignature } = params
  const startTime = Date.now()

  try {
    // 1. Get provider details
    const provider = await db.provider.findUnique({
      where: { id: serviceId },
    })

    if (!provider) {
      throw new Error(`Provider not found: ${serviceId}`)
    }

    if (!provider.isActive) {
      throw new Error(`Provider is not active: ${provider.name}`)
    }

    // 2. Verify payment transaction
    const paymentValid = await verifyTransaction(
      paymentTxSignature,
      provider.walletAddress,
      provider.pricePerRequest
    )

    if (!paymentValid) {
      throw new Error('Payment verification failed')
    }

    // 3. Create inference request record
    const request = await db.inferenceRequest.create({
      data: {
        userWallet,
        providerId: serviceId,
        input,
        output: null,
        status: 'processing',
        cost: provider.pricePerRequest,
        txSignature: paymentTxSignature,
      },
    })

    // 4. Create escrow record
    const escrowId = await createEscrowRecord(
      request.id,
      provider.pricePerRequest,
      paymentTxSignature
    )

    try {
      // 5. Route to AI provider and get inference result
      const output = await routeToProvider(serviceId, input)
      const processingTime = (Date.now() - startTime) / 1000

      // 6. Update request with successful result
      const updatedRequest = await db.inferenceRequest.update({
        where: { id: request.id },
        data: {
          output,
          status: 'completed',
          processingTime,
          completedAt: new Date(),
        },
      })

      // 7. Release escrow to provider
      await settleEscrow(escrowId, provider.walletAddress)

      // 8. Update provider stats
      await db.provider.update({
        where: { id: serviceId },
        data: {
          totalRequests: {
            increment: 1,
          },
          // Recalculate success rate and avg response time would be done in production
        },
      })

      // 9. Return result
      return {
        requestId: updatedRequest.id,
        providerId: provider.id,
        providerName: provider.name,
        input: updatedRequest.input,
        output: updatedRequest.output!,
        status: updatedRequest.status,
        cost: updatedRequest.cost,
        processingTime,
        timestamp: updatedRequest.createdAt,
      }
    } catch (inferenceError: any) {
      // Inference failed - refund escrow and update request
      console.error('Inference failed:', inferenceError)

      await db.inferenceRequest.update({
        where: { id: request.id },
        data: {
          status: 'failed',
          errorMessage: inferenceError.message,
          completedAt: new Date(),
        },
      })

      // Refund escrow to user
      await refundEscrow(escrowId, userWallet)

      throw new Error(`Inference failed: ${inferenceError.message}`)
    }
  } catch (error: any) {
    console.error('Submit inference error:', error)
    throw error
  }
}

/**
 * Verify Payment and Create Escrow
 * Used by API routes to verify payment before processing
 */
export async function verifyPaymentAndEscrow(
  serviceId: string,
  txSignature: string,
  userWallet: string
): Promise<{ valid: boolean; escrowId?: string; error?: string }> {
  try {
    // Get provider to verify payment amount
    const provider = await db.provider.findUnique({
      where: { id: serviceId },
    })

    if (!provider) {
      return { valid: false, error: 'Provider not found' }
    }

    // Verify the transaction
    const isValid = await verifyTransaction(
      txSignature,
      provider.walletAddress,
      provider.pricePerRequest
    )

    if (!isValid) {
      return { valid: false, error: 'Payment verification failed' }
    }

    return { valid: true }
  } catch (error: any) {
    console.error('Verify payment error:', error)
    return { valid: false, error: error.message }
  }
}

/**
 * Get Inference Request Status
 */
export async function getInferenceRequest(requestId: string) {
  try {
    const request = await db.inferenceRequest.findUnique({
      where: { id: requestId },
      include: {
        provider: true,
        escrowTransaction: true,
      },
    })

    return request
  } catch (error: any) {
    console.error('Get inference request error:', error)
    return null
  }
}

/**
 * Release Escrow to Provider
 * Called after successful inference completion
 */
export async function releaseEscrowToProvider(requestId: string): Promise<void> {
  try {
    const request = await db.inferenceRequest.findUnique({
      where: { id: requestId },
      include: {
        provider: true,
        escrowTransaction: true,
      },
    })

    if (!request) {
      throw new Error('Request not found')
    }

    if (!request.escrowTransaction) {
      throw new Error('Escrow not found for request')
    }

    if (request.escrowTransaction.status !== 'held') {
      console.log(`Escrow already ${request.escrowTransaction.status}`)
      return
    }

    await settleEscrow(request.escrowTransaction.id, request.provider.walletAddress)
  } catch (error: any) {
    console.error('Release escrow error:', error)
    throw error
  }
}

/**
 * Refund Escrow to User
 * Called when inference fails
 */
export async function refundEscrowToUser(requestId: string): Promise<void> {
  try {
    const request = await db.inferenceRequest.findUnique({
      where: { id: requestId },
      include: {
        escrowTransaction: true,
      },
    })

    if (!request) {
      throw new Error('Request not found')
    }

    if (!request.escrowTransaction) {
      throw new Error('Escrow not found for request')
    }

    if (request.escrowTransaction.status !== 'held') {
      console.log(`Escrow already ${request.escrowTransaction.status}`)
      return
    }

    await refundEscrow(request.escrowTransaction.id, request.userWallet)
  } catch (error: any) {
    console.error('Refund escrow error:', error)
    throw error
  }
}

/**
 * Get User's Inference History
 */
export async function getUserInferenceHistory(userWallet: string, limit: number = 20) {
  try {
    const requests = await db.inferenceRequest.findMany({
      where: {
        userWallet,
      },
      include: {
        provider: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return requests
  } catch (error: any) {
    console.error('Get user history error:', error)
    return []
  }
}

/**
 * Get Provider's Request History
 */
export async function getProviderRequests(providerId: string, limit: number = 50) {
  try {
    const requests = await db.inferenceRequest.findMany({
      where: {
        providerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return requests
  } catch (error: any) {
    console.error('Get provider requests error:', error)
    return []
  }
}

/**
 * Get Provider Statistics
 */
export async function getProviderStats(providerId: string) {
  try {
    const provider = await db.provider.findUnique({
      where: { id: providerId },
    })

    if (!provider) {
      return null
    }

    // Get request counts
    const totalRequests = await db.inferenceRequest.count({
      where: { providerId },
    })

    const completedRequests = await db.inferenceRequest.count({
      where: { providerId, status: 'completed' },
    })

    const failedRequests = await db.inferenceRequest.count({
      where: { providerId, status: 'failed' },
    })

    // Calculate total earnings
    const requests = await db.inferenceRequest.findMany({
      where: { providerId, status: 'completed' },
      select: { cost: true },
    })

    const totalEarnings = requests.reduce((sum, req) => sum + req.cost, 0)

    // Get pending escrow
    const pendingEscrow = await db.escrowTransaction.count({
      where: {
        request: {
          providerId,
        },
        status: 'held',
      },
    })

    return {
      provider,
      totalRequests,
      completedRequests,
      failedRequests,
      successRate: totalRequests > 0 ? completedRequests / totalRequests : 0,
      totalEarnings,
      pendingEscrow,
    }
  } catch (error: any) {
    console.error('Get provider stats error:', error)
    return null
  }
}

