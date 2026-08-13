import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-utils';
import { verifyEventLogChain } from '@/lib/integrity-utils';

/**
 * GET /api/integrity
 * Verifies SHA-256 hash chaining integrity of all persisted event records (FR-2.4).
 * Accessible to Analysts, Administrators, and Auditors.
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    const user = await getSessionUser(sessionToken || '');
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired.' }, { status: 401 });
    }

    const verificationResult = await verifyEventLogChain();

    return NextResponse.json(verificationResult, { status: 200 });
  } catch (error) {
    console.error('Error verifying integrity chain:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
