import prisma from './prisma';
import crypto from 'crypto';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (FR-6.5 session timeout)

/**
 * Creates a new session for a user and returns the token.
 */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
  
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validates a session token, updates its expiration (sliding window), and returns the user.
 * If invalid or expired, returns null.
 */
export async function getSessionUser(token: string) {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  // Check if session has expired
  if (session.expiresAt.getTime() < Date.now()) {
    // Invalidate/delete expired session
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Session is valid. Implement sliding window: update expiresAt
  const newExpiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: newExpiresAt },
  });

  return session.user;
}

/**
 * Deletes/invalidates a session.
 */
export async function destroySession(token: string): Promise<void> {
  if (!token) return;
  await prisma.session.delete({ where: { token } }).catch(() => {});
}
