import { NextRequest, NextResponse } from 'next/server'
import { getProviderStats, getProviderRequests } from '@/lib/inference-engine'

/**
 * GET /api/provider/stats?providerId=xxx
 * Get provider statistics and recent requests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    // Get provider stats
    const stats = await getProviderStats(providerId)

    if (!stats) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Get recent requests
    const recentRequests = await getProviderRequests(providerId, 10)

    return NextResponse.json({
      stats: {
        providerId: stats.provider.id,
        providerName: stats.provider.name,
        totalRequests: stats.totalRequests,
        completedRequests: stats.completedRequests,
        failedRequests: stats.failedRequests,
        successRate: stats.successRate,
        totalEarnings: stats.totalEarnings,
        pendingEscrow: stats.pendingEscrow,
        pricePerRequest: stats.provider.pricePerRequest,
        rating: stats.provider.rating,
      },
      recentRequests: recentRequests.map(req => ({
        id: req.id,
        userWallet: req.userWallet,
        status: req.status,
        cost: req.cost,
        processingTime: req.processingTime,
        createdAt: req.createdAt,
        completedAt: req.completedAt,
      })),
    })
  } catch (error: any) {
    console.error('Get provider stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provider stats' },
      { status: 500 }
    )
  }
}

