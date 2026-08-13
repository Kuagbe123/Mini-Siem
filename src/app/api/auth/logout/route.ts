import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/session-utils';

/**
 * POST /api/auth/logout
 * Clears user session.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (sessionToken) {
      await destroySession(sessionToken);
    }

    const response = NextResponse.json({ success: true });
    
    // Delete cookie by setting Max-Age to 0
    response.cookies.set('session_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
