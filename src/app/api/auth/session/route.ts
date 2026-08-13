import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-utils';

/**
 * GET /api/auth/session
 * Returns current authenticated user session if valid.
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    const user = await getSessionUser(sessionToken || '');

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
