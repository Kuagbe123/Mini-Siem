import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-utils';
import { Role } from '@prisma/client';

/**
 * GET /api/audit
 * List system audit log records (FR-7.4).
 * Restricted to Administrator and Auditor roles.
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    const user = await getSessionUser(sessionToken || '');
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired.' }, { status: 401 });
    }

    // Auditors and Administrators are authorized (Least privilege check)
    if (user.role !== Role.ADMINISTRATOR && user.role !== Role.AUDITOR) {
      return NextResponse.json({ error: 'Forbidden: Restricted to Administrators and Auditors.' }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            username: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit log retrieval
    });

    return NextResponse.json({ auditLogs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
