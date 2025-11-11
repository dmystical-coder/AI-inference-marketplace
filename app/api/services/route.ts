import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/services
 * Get all active AI service providers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'rating'

    // Build query
    const where: any = {
      isActive: true,
    }

    if (category && category !== 'all') {
      where.category = category
    }

    // Get providers
    const providers = await db.provider.findMany({
      where,
      orderBy: (() => {
        switch (sortBy) {
          case 'price-low':
            return { pricePerRequest: 'asc' }
          case 'price-high':
            return { pricePerRequest: 'desc' }
          case 'rating':
            return { rating: 'desc' }
          case 'requests':
            return { totalRequests: 'desc' }
          default:
            return { rating: 'desc' }
        }
      })(),
    })

    // Transform to match frontend Service type
    const services = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      provider: provider.walletAddress.substring(0, 8) + '...',
      providerWallet: provider.walletAddress, // Full wallet address for payments
      pricePerRequest: provider.pricePerRequest,
      category: provider.category,
      rating: provider.rating,
      totalRequests: provider.totalRequests,
      successRate: provider.successRate,
      averageResponseTime: provider.avgResponseTime,
    }))

    return NextResponse.json({
      services,
      count: services.length,
    })
  } catch (error: any) {
    console.error('Get services error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch services',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

