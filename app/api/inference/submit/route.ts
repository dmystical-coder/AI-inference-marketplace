import { NextRequest, NextResponse } from 'next/server'
import { submitInference } from '@/lib/inference-engine'

/**
 * POST /api/inference/submit
 * Submit an inference request with payment verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, input, paymentTx, userWallet } = body

    // Validate request
    if (!serviceId || !input || !paymentTx) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, input, paymentTx' },
        { status: 400 }
      )
    }

    // For X402 integration, we get userWallet from session or payment
    // For now, use provided userWallet or a placeholder
    const wallet = userWallet || 'user-wallet-placeholder'

    // Submit inference (includes payment verification, escrow, and AI call)
    const result = await submitInference({
      serviceId,
      input,
      userWallet: wallet,
      paymentTxSignature: paymentTx,
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Inference submission error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to process inference request'
      },
      { status: 500 }
    )
  }
}

