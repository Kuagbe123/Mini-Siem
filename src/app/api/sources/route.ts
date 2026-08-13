import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-utils';
import { Role } from '@prisma/client';
import crypto from 'crypto';

/**
 * GET /api/sources
 * List all registered Event Sources (Requires Analyst, Administrator, or Auditor)
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    const user = await getSessionUser(sessionToken || '');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired.' }, { status: 401 });
    }

    const sources = await prisma.eventSource.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        token: true, // In production, we might mask this, but for the exam project we'll show it
        createdAt: true,
      },
    });

    return NextResponse.json({ sources }, { status: 200 });
  } catch (error) {
    console.error('Error listing event sources:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/sources
 * Registers a new Event Source (Requires Administrator role)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate and Authorize Administrator (FR-6.3)
    const sessionToken = req.cookies.get('session_token')?.value;
    const user = await getSessionUser(sessionToken || '');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired.' }, { status: 401 });
    }

    if (user.role !== Role.ADMINISTRATOR) {
      return NextResponse.json({ error: 'Forbidden: Requires Administrator privileges.' }, { status: 403 });
    }

    // 2. Parse request body
    const body = await req.json().catch(() => null);
    if (!body || !body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Bad Request: Missing or invalid "name" field.' }, { status: 400 });
    }

    const name = body.name.trim();

    // Check if name already registered
    const existing = await prisma.eventSource.findUnique({
      where: { name },
    });
    if (existing) {
      return NextResponse.json({ error: 'Conflict: An Event Source with this name already exists.' }, { status: 409 });
    }

    // 3. Generate secure token
    const token = crypto.randomBytes(24).toString('hex');

    // 4. Persist EventSource
    const newSource = await prisma.eventSource.create({
      data: {
        name,
        token,
      },
    });

    // 5. Write audit log entry (FR-7.1)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EVENT_SOURCE_REGISTER',
        details: `Registered event source "${name}" (ID: ${newSource.id})`,
      },
    });

    return NextResponse.json({ source: newSource }, { status: 201 });
  } catch (error) {
    console.error('Error registering event source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
