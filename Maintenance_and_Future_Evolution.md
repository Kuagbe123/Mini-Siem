# Maintenance Strategy and Future Software Evolution Plan
## Lifecycle Management Framework for the Mini-SIEM Platform

**Document ID:** MAINT-MSIEM-001  
**Version:** 1.0  
**Prepared For:** CSCD602: Advanced Software Engineering — Individual Project-Based Examination  
**Prepared By:** [Student Name] — [Student ID]  
**Date:** [Submission Date]  

---

## 1. Lifecycle Maintenance Strategy

A structured maintenance framework is essential to preserve the reliability, security, and performance of the Mini-SIEM platform post-deployment. The maintenance lifecycle is split into the four standard categories defined by ISO/IEC 14764:

### 1.1. Corrective Maintenance (Bug Fixing)
* **Scope:** Reactively diagnosing and repairing bugs, runtime faults, and security vulnerabilities discovered in production.
* **Procedures:**
  - Establish a centralized error logging system (e.g. Sentry) to capture stack traces from Next.js server components and client renders.
  - Set up a severity-based triage process: Priority 1 (Security vulnerabilities or database locks) resolved within 4 hours; Priority 2 (UI rendering issues) resolved in scheduled weekly patches.

### 1.2. Adaptive Maintenance (Environmental Adjustments)
* **Scope:** Adjusting the software to run in changing deployment environments (e.g. database migrations, new hosting configurations, or Next.js framework upgrades).
* **Procedures:**
  - Monitor deprecation warnings in the Next.js runtime environment.
  - Maintain absolute platform portability via Prisma ORM, allowing swift transitions from SQLite (development) to production PostgreSQL (Render/RDS) by modifying only the `DATABASE_URL` environment variable.

### 1.3. Perfective Maintenance (Performance & User Experience)
* **Scope:** Enhancing existing code, refining User Experience, and optimizing system responsiveness based on user feedback.
* **Procedures:**
  - Conduct routine query profiling on the event logging tables to ensure indexing works efficiently.
  - Implement caching (e.g. React `useMemo` or Redis) for the dashboard dashboard metric cards to reduce database query load during peak traffic.

### 1.4. Preventive Maintenance (Technical Debt Mitigation)
* **Scope:** Inspecting, refactoring, and restructuring code to prevent future defects, avoid system rot, and simplify code legibility.
* **Procedures:**
  - Execute automated code quality linters (`eslint`, `prettier`) on every pre-commit hook to maintain standard spacing, styling, and import rules.
  - Maintain a living technical debt plan (DEBT-MSIEM-001) to continuously schedule refactoring windows.

---

## 2. Updates and Security Patching

To counter threat vectors and dependency deprecations:
1. **Automated Vulnerability Alerts:** Configure GitHub Dependabot to scan package dependencies daily. Dependency updates (`npm update`) will be run in staging environments weekly, with critical patches deployed immediately.
2. **Database Backups:** Set up nightly automated pg_dump backups for the PostgreSQL instance on Render, with copies replicated across multiple availability zones.
3. **Audit Trail Review:** Conduct monthly reviews of the system audit trails (`AUDIT_LOG` table) to verify admin actions and ensure no unauthorized configuration updates occurred.

---

## 3. Future Evolution Roadmap

The future functional roadmap for the platform is designed to scale it from a lightweight prototype to an enterprise-capable logging engine:

```
+-----------------------------------------------------------------------------+
|  ROADMAP STAGES                                                             |
|                                                                             |
|  Stage 1: Real-Time Stream Engine (BullMQ + Redis Streams)                  |
|  * Replaces current polling-based detection engine with true real-time.    |
|                                                                             |
|  Stage 2: Columnar Logs Store Integration (ClickHouse)                      |
|  * Replaces PostgreSQL relational logging with big-data columnar logs indexing. |
|                                                                             |
|  Stage 3: Advanced Correlation Rules & Anomaly Detection                    |
|  * Integrates multi-event correlation logic and anomaly detection heuristics.|
+-----------------------------------------------------------------------------+
```

This evolution strategy guarantees that the platform remains adaptive, stable, and highly maintainable throughout its operational lifetime.
