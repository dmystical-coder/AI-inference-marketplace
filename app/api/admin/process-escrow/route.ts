import { NextRequest, NextResponse } from 'next/server'
import { getPendingEscrows, settleEscrow, refundEscrow } from '@/lib/solana-escrow'

/**
 * POST /api/admin/process-escrow
 * Process pending escrow transactions
 * This should be called by a cron job or scheduled task
 * 
 * In production, protect this with API key authentication
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Get all pending escrows
    const pendingEscrows = await getPendingEscrows()

    const results = {
      processed: 0,
      released: 0,
      refunded: 0,
      errors: [] as string[],
    }

    for (const escrow of pendingEscrows) {
      try {
        const request = escrow.request

        // Check if request is completed - release to provider
        if (request.status === 'completed') {
          await settleEscrow(escrow.id, request.provider.walletAddress)
          results.released++
          results.processed++
        }
        // Check if request failed - refund to user
        else if (request.status === 'failed') {
          await refundEscrow(escrow.id, request.userWallet)
          results.refunded++
          results.processed++
        }
        // If still processing and older than 10 minutes, might need manual review
        else if (request.status === 'processing') {
          const age = Date.now() - new Date(request.createdAt).getTime()
          if (age > 10 * 60 * 1000) { // 10 minutes
            console.warn(`Request ${request.id} stuck in processing for ${age}ms`)
            // Could implement timeout logic here
          }
        }
      } catch (error: any) {
        console.error(`Error processing escrow ${escrow.id}:`, error)
        results.errors.push(`${escrow.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} escrow transactions`,
      results,
    })
  } catch (error: any) {
    console.error('Process escrow error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process escrow transactions',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/process-escrow
 * Get pending escrow status
 */
export async function GET() {
  try {
    const pendingEscrows = await getPendingEscrows()

    return NextResponse.json({
      count: pendingEscrows.length,
      escrows: pendingEscrows.map(e => ({
        id: e.id,
        requestId: e.requestId,
        amount: e.amount,
        status: e.status,
        requestStatus: e.request.status,
        createdAt: e.createdAt,
        age: Date.now() - new Date(e.createdAt).getTime(),
      })),
    })
  } catch (error: any) {
    console.error('Get pending escrows error:', error)
    return NextResponse.json(
      { error: 'Failed to get pending escrows' },
      { status: 500 }
    )
  }
}

