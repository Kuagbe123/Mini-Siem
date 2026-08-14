const assert = require('assert');
const crypto = require('crypto');

// Unit Test Suite for Mini-SIEM Security & Utility Functions

const ITERATIONS = 10000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
}

function validatePasswordStrength(password) {
  if (password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumber && hasSpecial;
}

function calculateEventHash(timestamp, eventType, severity, sourceId, payloadData, prevHash) {
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

function runUnitTests() {
  console.log('=== RUNNING UNIT TEST SUITE ===\n');

  // Test 1: Password Strength Policy
  console.log('[Unit Test 1] Testing Password Strength Validation (FR-6.6)...');
  assert.strictEqual(validatePasswordStrength('AdminPassword123!'), true, 'Valid password should pass');
  assert.strictEqual(validatePasswordStrength('Short1!'), false, 'Too short password should fail');
  assert.strictEqual(validatePasswordStrength('adminpassword123!'), false, 'Password without uppercase should fail');
  assert.strictEqual(validatePasswordStrength('ADMINPASSWORD123!'), false, 'Password without lowercase should fail');
  assert.strictEqual(validatePasswordStrength('AdminPassword!'), false, 'Password without numbers should fail');
  assert.strictEqual(validatePasswordStrength('AdminPassword123'), false, 'Password without special char should fail');
  console.log('  ✓ Password Strength Policy Unit Tests Passed!');

  // Test 2: Password PBKDF2 Hashing and Verification
  console.log('\n[Unit Test 2] Testing PBKDF2 Cryptographic Hashing...');
  const pass = 'SuperSecretPass123!';
  const hashed = hashPassword(pass);
  assert.strictEqual(hashed.includes(':'), true, 'Hashed password format must contain salt separator');
  assert.strictEqual(verifyPassword(pass, hashed), true, 'Valid password verification must return true');
  assert.strictEqual(verifyPassword('WrongPassword123!', hashed), false, 'Invalid password verification must return false');
  console.log('  ✓ Password Hashing & Verification Unit Tests Passed!');

  // Test 3: SHA-256 Tamper-Evident Event Hash Chaining
  console.log('\n[Unit Test 3] Testing SHA-256 Cryptographic Hash Chaining Integrity...');
  const now = new Date();
  const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const hash1 = calculateEventHash(now, 'auth.failed', 'HIGH', 'src-1', { user: 'victim' }, prevHash);
  assert.strictEqual(typeof hash1, 'string');
  assert.strictEqual(hash1.length, 64, 'SHA-256 digest must be 64 hex characters');

  // Tamper detection test
  const hash2Tampered = calculateEventHash(now, 'auth.failed', 'HIGH', 'src-1', { user: 'attacker_modified' }, prevHash);
  assert.notStrictEqual(hash1, hash2Tampered, 'Modified payload data must produce a different hash');
  console.log('  ✓ Tamper-Evident Cryptographic Hash Chaining Unit Tests Passed!');

  console.log('\n=== ALL UNIT TESTS PASSED SUCCESSFULLY ===');
}

runUnitTests();
