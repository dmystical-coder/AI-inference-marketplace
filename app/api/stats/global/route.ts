import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [totalRequests, activeProviders, volumeData] = await Promise.all([
      db.inferenceRequest.count(),
      db.provider.count({
        where: { isActive: true },
      }),
      db.inferenceRequest.aggregate({
        _sum: {
          cost: true,
        },
      }),
    ])

    return NextResponse.json({
      totalRequests,
      totalProviders: activeProviders,
      totalVolume: volumeData._sum.cost || 0,
    })
  } catch (error) {
    console.error('Failed to fetch global stats:', error)
    return NextResponse.json({
      totalRequests: 0,
      totalProviders: 0,
      totalVolume: 0,
    })
  }
}

