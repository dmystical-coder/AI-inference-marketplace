import { NextRequest, NextResponse } from 'next/server'
import { getInferenceRequest } from '@/lib/inference-engine'

/**
 * GET /api/inference/status/[requestId]
 * Get the status of an inference request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const inferenceRequest = await getInferenceRequest(requestId)

    if (!inferenceRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      request: {
        id: inferenceRequest.id,
        status: inferenceRequest.status,
        input: inferenceRequest.input,
        output: inferenceRequest.output,
        cost: inferenceRequest.cost,
        processingTime: inferenceRequest.processingTime,
        createdAt: inferenceRequest.createdAt,
        completedAt: inferenceRequest.completedAt,
        errorMessage: inferenceRequest.errorMessage,
        provider: {
          id: inferenceRequest.provider.id,
          name: inferenceRequest.provider.name,
        },
      },
    })
  } catch (error: any) {
    console.error('Get inference status error:', error)
    return NextResponse.json(
      { error: 'Failed to get request status' },
      { status: 500 }
    )
  }
}

