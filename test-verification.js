/**
 * Integration Test Verification Script for Mini-SIEM
 * Verifies Functional Requirements F1-F7.
 */

const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Global State
let sessionCookie = '';
let sourceToken = '';
let eventId = '';
let alertId = '';

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS ===\n');

  try {
    // 1. Test Login (FR-6.1, FR-6.6)
    console.log('[Test 1] Authenticating with default Admin credentials...');
    const loginRes = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'AdminPassword123!'
    });
    
    if (loginRes.status === 200 && loginRes.body.success) {
      console.log('  ✓ Login Success!');
      const setCookie = loginRes.headers['set-cookie'];
      if (setCookie && setCookie[0]) {
        sessionCookie = setCookie[0].split(';')[0];
      }
    } else {
      throw new Error(`Login Failed: ${JSON.stringify(loginRes.body)}`);
    }

    // 2. Test Event Source Registration (FR-1.5, FR-6.3)
    console.log('\n[Test 2] Registering a new Event Source (requires Admin)...');
    const sourceRes = await request('POST', '/api/sources', 
      { name: 'Firewall-Gate' },
      { 'Cookie': sessionCookie }
    );

    if (sourceRes.status === 201 && sourceRes.body.source) {
      sourceToken = sourceRes.body.source.token;
      console.log(`  ✓ Registration Success! Token: ${sourceToken}`);
    } else {
      throw new Error(`Source Registration Failed: ${JSON.stringify(sourceRes.body)}`);
    }

    // 3. Test Event Ingestion Schema Validation (FR-1.2, FR-1.3)
    console.log('\n[Test 3] Testing event ingestion schema validation (rejection test)...');
    const invalidEventRes = await request('POST', '/api/events',
      { timestamp: 'invalid-date' }, // Invalid format
      { 'Authorization': `Bearer ${sourceToken}` }
    );

    if (invalidEventRes.status === 400) {
      console.log('  ✓ Schema Validation correctly rejected invalid event!');
    } else {
      throw new Error(`Schema Validation Failed to reject event: Status ${invalidEventRes.status}`);
    }

    // 4. Test Event Ingestion (FR-1.1, FR-2.1, FR-2.4)
    console.log('\n[Test 4] Ingesting valid security event with integrity chaining...');
    const validEventRes = await request('POST', '/api/events',
      {
        timestamp: new Date().toISOString(),
        eventType: 'failed_login',
        severity: 'HIGH',
        payload: { username: 'root', ip: '192.168.1.150' }
      },
      { 'Authorization': `Bearer ${sourceToken}` }
    );

    if (validEventRes.status === 201 && validEventRes.body.success) {
      eventId = validEventRes.body.eventId;
      console.log(`  ✓ Ingestion Success! Event ID: ${eventId}, Block Hash: ${validEventRes.body.hash}`);
    } else {
      throw new Error(`Ingestion Failed: ${JSON.stringify(validEventRes.body)}`);
    }

    // 5. Test Detection Engine and Alerting (FR-3.2, FR-3.3, FR-4.1)
    console.log('\n[Test 5] Injecting 4 more failed logins to trigger Brute Force Threshold Alert...');
    for (let i = 0; i < 4; i++) {
      await request('POST', '/api/events',
        {
          timestamp: new Date().toISOString(),
          eventType: 'failed_login',
          severity: 'HIGH',
          payload: { username: 'root', ip: '192.168.1.150' }
        },
        { 'Authorization': `Bearer ${sourceToken}` }
      );
    }

    console.log('  Checking generated alerts...');
    const alertRes = await request('GET', '/api/alerts', null, { 'Cookie': sessionCookie });
    if (alertRes.status === 200 && alertRes.body.alerts.length > 0) {
      const matchAlert = alertRes.body.alerts.find(a => a.ruleName === 'Brute Force Login Attempt');
      if (matchAlert) {
        alertId = matchAlert.id;
        console.log(`  ✓ Alert Triggered! Alert ID: ${alertId}, Status: ${matchAlert.status}`);
      } else {
        throw new Error('Rule was not matched.');
      }
    } else {
      throw new Error(`Alert Retrieval Failed: ${JSON.stringify(alertRes.body)}`);
    }

    // 6. Test Alert Triage (FR-4.4)
    console.log('\n[Test 6] Triaging the triggered alert...');
    const triageRes = await request('PATCH', `/api/alerts/${alertId}`, 
      { status: 'INVESTIGATING', notes: 'Forensic audit in progress on source IP.' },
      { 'Cookie': sessionCookie }
    );

    if (triageRes.status === 200 && triageRes.body.alert.status === 'INVESTIGATING') {
      console.log('  ✓ Alert triaged to UNDER INVESTIGATION!');
    } else {
      throw new Error(`Alert Triage Failed: ${JSON.stringify(triageRes.body)}`);
    }

    // 7. Test Log Chain Integrity Verification (FR-2.4)
    console.log('\n[Test 7] Running cryptographic hash chain integrity verification...');
    const integrityRes = await request('GET', '/api/integrity', null, { 'Cookie': sessionCookie });
    if (integrityRes.status === 200 && integrityRes.body.isValid) {
      console.log(`  ✓ Integrity check PASSED! Checked ${integrityRes.body.totalChecked} events successfully.`);
    } else {
      throw new Error(`Integrity Validation Failed: ${JSON.stringify(integrityRes.body)}`);
    }

    // 8. Test Audit Trail (FR-7.1, FR-7.4)
    console.log('\n[Test 8] Fetching system audit logs...');
    const auditRes = await request('GET', '/api/audit', null, { 'Cookie': sessionCookie });
    if (auditRes.status === 200 && auditRes.body.auditLogs.length > 0) {
      console.log(`  ✓ Audit logs retrieved! Total logged events: ${auditRes.body.auditLogs.length}`);
    } else {
      throw new Error(`Audit Retrieval Failed: ${JSON.stringify(auditRes.body)}`);
    }

    console.log('\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ TEST RUN FAILED WITH ERROR:', error.message);
    process.exit(1);
  }
}

// Start execution
runTests();
