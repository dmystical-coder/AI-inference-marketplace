import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const recentRequests = await db.inferenceRequest.findMany({
      where: {
        status: 'completed',
      },
      include: {
        provider: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    const activities = recentRequests.map((request) => ({
      id: request.id,
      service: request.provider.name,
      timestamp: request.createdAt,
      user: request.userWallet,
    }))

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Failed to fetch recent activity:', error)
    return NextResponse.json({ activities: [] })
  }
}

