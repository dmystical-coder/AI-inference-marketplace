import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Session token configuration
const SESSION_TOKEN_NAME = 'x402-session'
const SESSION_DURATION = 60 * 60 * 24 // 24 hours in seconds

/**
 * POST /api/x402/session-token
 * 
 * This endpoint is called by the X402 middleware after successful payment verification.
 * It creates a session token that allows access to protected content.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // The X402 middleware sends payment verification data
    const { transactionHash, amount, route } = body
    
    if (!transactionHash) {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      )
    }
    
    // Generate a session token (in production, use a proper JWT library)
    const sessionToken = Buffer.from(
      JSON.stringify({
        transactionHash,
        amount,
        route,
        timestamp: Date.now(),
        expires: Date.now() + (SESSION_DURATION * 1000),
      })
    ).toString('base64')
    
    // Set the session cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: SESSION_TOKEN_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    })
    
    // Return success response
    return NextResponse.json({
      success: true,
      sessionToken,
      expiresIn: SESSION_DURATION,
    })
  } catch (error) {
    console.error('Error creating session token:', error)
    return NextResponse.json(
      { error: 'Failed to create session token' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/x402/session-token
 * 
 * Check if a valid session exists
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_TOKEN_NAME)
    
    if (!sessionToken) {
      return NextResponse.json(
        { valid: false, error: 'No session found' },
        { status: 401 }
      )
    }
    
    // Decode and validate the token
    try {
      const decoded = JSON.parse(
        Buffer.from(sessionToken.value, 'base64').toString()
      )
      
      // Check if token is expired
      if (decoded.expires < Date.now()) {
        return NextResponse.json(
          { valid: false, error: 'Session expired' },
          { status: 401 }
        )
      }
      
      return NextResponse.json({
        valid: true,
        route: decoded.route,
        expiresAt: decoded.expires,
      })
    } catch (decodeError) {
      return NextResponse.json(
        { valid: false, error: 'Invalid session token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error checking session:', error)
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/x402/session-token
 * 
 * Clear the session (logout)
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_TOKEN_NAME)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}

