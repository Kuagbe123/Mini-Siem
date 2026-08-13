import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth-utils';
import { createSession } from '@/lib/session-utils';
import { ensureDatabaseSeeded } from '@/lib/db-init';

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns a session cookie.
 */
export async function POST(req: NextRequest) {
  await ensureDatabaseSeeded(); // Dynamic self-healing seed

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.username || !body.password) {
      return NextResponse.json(
        { error: 'Bad Request: Missing username or password.' },
        { status: 400 }
      );
    }

    const username = body.username.trim();
    const password = body.password;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      // Record failed authentication in audit log (FR-7.1)
      await prisma.auditLog.create({
        data: {
          action: 'AUTH_FAILURE',
          details: `Failed authentication attempt for username: "${username}"`,
        },
      });

      return NextResponse.json(
        { error: 'Unauthorized: Invalid credentials.' },
        { status: 401 }
      );
    }

    // Create session token (FR-6.1)
    const token = await createSession(user.id);

    // Record successful authentication in audit log (FR-7.1)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AUTH_SUCCESS',
        details: `Successful authentication for user: "${username}"`,
      },
    });

    // Build response with secure session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    // Set cookie: HttpOnly, Secure, SameSite=Lax (FR-6.5 session)
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes session timeout
    });

    return response;
  } catch (error) {
    console.error('Error during authentication login:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
