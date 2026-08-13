import prisma from './prisma';
import crypto from 'crypto';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Calculates the hash of an event including the previous event's hash.
 */
export function calculateEventHash(
  timestamp: Date,
  eventType: string,
  severity: string,
  sourceId: string,
  payloadData: any,
  prevHash: string
): string {
  const dataToHash = JSON.stringify({
    timestamp: timestamp.toISOString(),
    eventType,
    severity,
    sourceId,
    payloadData,
    prevHash,
  });

  return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

/**
 * Prepares the payload for a new event, embedding the prevHash and newHash to ensure chain integrity.
 */
export async function sealEventPayload(
  timestamp: Date,
  eventType: string,
  severity: string,
  sourceId: string,
  userPayload: any
): Promise<{ securedPayload: any; hash: string }> {
  // Find the last event in the database to retrieve its hash
  const lastEvent = await prisma.event.findFirst({
    orderBy: { receivedAt: 'desc' },
  });

  let prevHash = GENESIS_HASH;
  if (lastEvent) {
    const lastPayload = lastEvent.payload as any;
    if (lastPayload && lastPayload._hash) {
      prevHash = lastPayload._hash;
    }
  }

  // Calculate hash
  const hash = calculateEventHash(timestamp, eventType, severity, sourceId, userPayload, prevHash);

  // Return the secured payload combining user data, previous hash, and current hash
  const securedPayload = {
    ...userPayload,
    _prevHash: prevHash,
    _hash: hash,
  };

  return { securedPayload, hash };
}

/**
 * Verifies the integrity of the entire event log chain in the database.
 * Returns an object indicating whether the chain is valid and any broken event IDs.
 */
export async function verifyEventLogChain(): Promise<{
  isValid: boolean;
  tamperedEventIds: string[];
  totalChecked: number;
}> {
  const events = await prisma.event.findMany({
    orderBy: { receivedAt: 'asc' },
  });

  let expectedPrevHash = GENESIS_HASH;
  const tamperedEventIds: string[] = [];

  for (const event of events) {
    const payload = event.payload as any;
    
    if (!payload || !payload._hash || !payload._prevHash) {
      tamperedEventIds.push(event.id);
      continue;
    }

    // Extract user payload without metadata fields
    const { _hash, _prevHash, ...userPayload } = payload;

    // Verify link to previous block
    if (_prevHash !== expectedPrevHash) {
      tamperedEventIds.push(event.id);
    }

    // Recompute current hash
    const recomputedHash = calculateEventHash(
      event.timestamp,
      event.eventType,
      event.severity,
      event.sourceId,
      userPayload,
      _prevHash
    );

    if (_hash !== recomputedHash) {
      tamperedEventIds.push(event.id);
    }

    // Advance chain state
    expectedPrevHash = _hash;
  }

  return {
    isValid: tamperedEventIds.length === 0,
    tamperedEventIds,
    totalChecked: events.length,
  };
}
