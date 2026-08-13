import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/db-init';
import { sealEventPayload } from '@/lib/integrity-utils';
import { runDetectionEngine } from '@/lib/detection-engine';
import { getSessionUser } from '@/lib/session-utils';

/**
 * POST /api/events
 * Programmatic ingestion endpoint for registered Event Sources.
 */
export async function POST(req: NextRequest) {
  await ensureDatabaseSeeded(); // Dynamic self-healing seed

  try {
    // 1. Authenticate Event Source via Bearer Token (FR-1.6)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Extract token
    const eventSource = await prisma.eventSource.findUnique({
      where: { token },
    });

    if (!eventSource) {
      // Record failed ingestion attempt in audit log
      await prisma.auditLog.create({
        data: {
          action: 'INGESTION_AUTH_FAILURE',
          details: `Rejected ingestion attempt with invalid source token.`,
        },
      });
      return NextResponse.json(
        { error: 'Unauthorized: Invalid event source token.' },
        { status: 401 }
      );
    }

    // 2. Parse and Validate Request Body (FR-1.2)
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Bad Request: Invalid JSON payload.' },
        { status: 400 }
      );
    }

    const { timestamp, eventType, severity, payload } = body;

    // Validate Schema Fields
    const errors: string[] = [];
    if (!timestamp || isNaN(Date.parse(timestamp))) {
      errors.push('Missing or invalid ISO-8601 "timestamp" field.');
    }
    if (!eventType || typeof eventType !== 'string' || eventType.trim() === '') {
      errors.push('Missing or invalid "eventType" field.');
    }
    if (!severity || typeof severity !== 'string' || severity.trim() === '') {
      errors.push('Missing or invalid "severity" field.');
    }
    if (!payload || typeof payload !== 'object') {
      errors.push('Missing or invalid "payload" object.');
    }

    if (errors.length > 0) {
      // Log validation failure in audit log (FR-1.3)
      await prisma.auditLog.create({
        data: {
          action: 'INGESTION_VALIDATION_FAILURE',
          details: `Rejected event from source "${eventSource.name}": ${errors.join(' ')}`,
        },
      });
      return NextResponse.json(
        { error: 'Bad Request: Schema validation failed.', validationErrors: errors },
        { status: 400 }
      );
    }

    // 3. Secure Event Payload using SHA-256 Hash Chaining (FR-2.4)
    const eventDate = new Date(timestamp);
    const { securedPayload, hash } = await sealEventPayload(
      eventDate,
      eventType,
      severity,
      eventSource.id,
      payload
    );

    // 4. Persist Event to Database (FR-2.1)
    const newEvent = await prisma.event.create({
      data: {
        timestamp: eventDate,
        eventType,
        severity,
        sourceId: eventSource.id,
        payload: securedPayload,
      },
    });

    // 5. Trigger Detection Engine (FR-3.2) - Run asynchronously/non-blocking
    // next.js App Router background task execution: we just don't await if we want to run non-blocking, 
    // but awaiting is fine here to guarantee correct rule matching before response. Let's await to be safe and deterministic.
    await runDetectionEngine(newEvent);

    return NextResponse.json(
      { success: true, eventId: newEvent.id, hash },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error during event ingestion:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events
 * Query historical events with filters (FR-2.2).
 * Accessible to Analysts, Administrators, and Auditors.
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    const user = await getSessionUser(sessionToken || '');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const sourceId = searchParams.get('sourceId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;
    if (sourceId) where.sourceId = sourceId;

    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) where.timestamp.gte = new Date(startTime);
      if (endTime) where.timestamp.lte = new Date(endTime);
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        source: {
          select: { name: true }
        }
      },
      orderBy: { receivedAt: 'desc' },
      take: 100 // Cap to prevent memory bloat
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('Error querying events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
