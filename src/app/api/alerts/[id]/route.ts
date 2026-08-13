import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-utils';
import { Role } from '@prisma/client';

const VALID_STATUSES = ['NEW', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];

/**
 * PATCH /api/alerts/[id]
 * Updates alert status and notes (FR-4.4).
 * Accessible to Analysts and Administrators.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Authenticate user
    const sessionToken = req.cookies.get('session_token')?.value;
    const user = await getSessionUser(sessionToken || '');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired.' }, { status: 401 });
    }

    // Auditors cannot edit alerts (Least privilege: FR-6.2, NFR-SEC-2)
    if (user.role === Role.AUDITOR) {
      return NextResponse.json({ error: 'Forbidden: Auditors cannot edit alert status.' }, { status: 403 });
    }

    // 2. Parse request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Bad Request: Missing request body.' }, { status: 400 });
    }

    const { status, notes } = body;

    // Fetch existing alert
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Not Found: Alert does not exist.' }, { status: 404 });
    }

    const updateData: any = {};
    const auditDetails: string[] = [];

    // Verify status update
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: `Bad Request: Invalid status value. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
      }
      updateData.status = status;
      auditDetails.push(`Status changed from "${alert.status}" to "${status}"`);
    }

    // Verify notes update
    if (notes !== undefined) {
      updateData.notes = notes;
      auditDetails.push(`Notes updated.`);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Bad Request: No fields provided to update.' }, { status: 400 });
    }

    // 3. Update alert in DB
    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: updateData,
    });

    // 4. Record action in audit logs (FR-7.1)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ALERT_STATUS_UPDATE',
        details: `Alert ID: ${id} modified. Details: ${auditDetails.join('. ')}. User Notes: "${notes || ''}"`,
      },
    });

    return NextResponse.json({ alert: updatedAlert }, { status: 200 });
  } catch (error) {
    console.error('Error updating alert status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
