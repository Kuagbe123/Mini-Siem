import prisma from './prisma';
import { hashPassword } from './auth-utils';
import { Role } from '@prisma/client';

export async function ensureDatabaseSeeded() {
  try {
    // 1. Ensure Default Admin User Exists
    const adminExists = await prisma.user.findFirst({
      where: { role: Role.ADMINISTRATOR },
    });

    if (!adminExists) {
      const defaultAdminUsername = 'admin';
      const defaultAdminPassword = 'AdminPassword123!'; // Strong password satisfying FR-6.6
      const passwordHash = hashPassword(defaultAdminPassword);
      
      const newAdmin = await prisma.user.create({
        data: {
          username: defaultAdminUsername,
          passwordHash: passwordHash,
          role: Role.ADMINISTRATOR,
        },
      });

      // Write system initialization audit log (FR-7.1)
      await prisma.auditLog.create({
        data: {
          userId: newAdmin.id,
          action: 'SYSTEM_INITIALIZATION',
          details: 'Default Administrator account provisioned successfully.',
        },
      });
      
      console.log('Seeded default administrator account.');
    }

    // 2. Ensure Default Detection Rules Exist (FR-3.3, FR-3.4)
    const ruleCount = await prisma.detectionRule.count();
    if (ruleCount === 0) {
      await prisma.detectionRule.createMany({
        data: [
          {
            name: 'Brute Force Login Attempt',
            description: 'Triggers when 5 failed login attempts occur from the same source within 60 seconds.',
            eventType: 'failed_login',
            threshold: 5,
            timeWindow: 60,
            severity: 'HIGH',
            isActive: true,
          },
          {
            name: 'Unauthorized Privilege Escalation',
            description: 'Triggers immediately when a user privilege escalation event is logged.',
            eventType: 'privilege_change',
            threshold: 1,
            timeWindow: 0,
            severity: 'CRITICAL',
            isActive: true,
          },
          {
            name: 'Audit Log Ingestion Failure',
            description: 'Triggers immediately when event source token validation or schema validation fails repeatedly.',
            eventType: 'ingestion_failure',
            threshold: 3,
            timeWindow: 120,
            severity: 'MEDIUM',
            isActive: true,
          },
          {
            name: 'Suspicious Log Clearance',
            description: 'Triggers immediately when system or security logs are cleared.',
            eventType: 'log_clearance',
            threshold: 1,
            timeWindow: 0,
            severity: 'CRITICAL',
            isActive: true,
          }
        ],
      });

      console.log('Seeded default detection rules.');
    }
  } catch (error) {
    console.error('Error during database seeding check:', error);
  }
}
