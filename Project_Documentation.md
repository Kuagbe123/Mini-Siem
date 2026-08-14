# Consolidated Project Documentation
## Mini Security Information and Event Management (Mini-SIEM) System

**Course:** CSCD602: Advanced Software Engineering (3 Credits)  
**Assessment:** Individual Project-Based Examination  
**Prepared By:** [Student Name] — [Student ID]  
**Date:** [Submission Date]  

---

## 1. Project Title
**Mini-SIEM: A Lightweight Security Event Logging, Correlation, and Audit Trail Management Platform.**

---

## 2. Problem Statement
Small-to-medium enterprises (SMEs) and academic labs face a significant barrier in securing their digital assets. Commercial-grade Security Information and Event Management (SIEM) systems (such as Splunk, QRadar, or Sentinel) are cost-prohibitive and operationally complex, requiring dedicated teams to manage. Consequently, many organizations operate with blind spots, lacking centralized visibility into authentication failures, privilege abuse, and anomalous access logs, leading to increased Mean Time to Detect (MTTD) credential-based attacks.

---

## 3. Aim and Objectives
* **Aim:** Design, implement, test, and deploy a lightweight, self-contained, and highly secure Mini-SIEM platform that ingests, audits, and correlates security events.
* **Objectives:**
  1. Build a secure JSON-based Ingestion API protecting payloads with API Token validation.
  2. Implement a Detection Rule Engine evaluating incoming logs against configured thresholds (e.g. brute-force login counts) to generate alerts.
  3. Ensure event log integrity using SHA-256 cryptographic hash chaining (tamper-evident store).
  4. Develop a premium, role-based Analyst Dashboard for incident response and audit trail reviews.

---

## 4. Stakeholders
1. **Security Analyst:** Monitors the dashboard, views alerts, and triages security incidents.
2. **Administrator:** Configures the system settings, registers event sources, and creates detection rules.
3. **Auditor:** Performs read-only compliance checks on historical events and internal system audit logs.
4. **Event Source (System Client):** Programmatic systems (firewalls, active directories) that ship security logs via API.

---

## 5. Requirements Analysis
System requirements were gathered to fulfill core SIEM lifecycle functions:
* **Functional Scope:**
  - Event Ingestion: Schema validation, token authentication, and timestamping.
  - Event Correlation: Rule condition evaluation.
  - Alert Management: Lifecycle statuses (`NEW`, `RESOLVED`) and annotations.
  - User Access: Role-Based Access Control (RBAC) and authentication.
  - Audit Trail: Log security actions within the system.
* **Non-Functional Scope:**
  - Security: Cryptographic hashing, password hashing (bcrypt), and input sanitization.
  - Performance: Quick query times under SQLite/PostgreSQL.
  - Usability: Frosted-glass dark-mode UI with clear navigation.

---

## 6. Software Requirements Specification (SRS) Summary
The full system requirements specification is detailed in the accompanying [`SRS_Mini-SIEM.docx`](file:///c:/Users/User/Desktop/Mini-Siem/SRS_Mini-SIEM.docx) (conforming to ISO/IEC/IEEE 29148:2018). It specifies the complete set of Functional Requirements (FR-1 through FR-7) and Non-Functional Requirements (NFR-SEC, NFR-MAINT, etc.).

---

## 7. Software Effort Estimation Summary
The estimation was conducted using **Use Case Points (UCP)** combined with **Task-Based Sizing** to plan development.
* **UCP Sizing:** Evaluated Actor Weight (10) and Use Case Weight (80) yielding 90 Unadjusted Use Case Points (UUCP). Adjusting for Technical/Environmental factors estimated a total development effort of **108.5 Person-Hours**.
* **Rationale:** This theoretical estimate guided project scoping: only high-priority "Must-Have" requirements were scheduled for the 48-hour exam window. The full calculations are documented in [`Effort_Estimation_Mini-SIEM.docx`](file:///c:/Users/User/Desktop/Mini-Siem/Effort_Estimation_Mini-SIEM.docx).

---

## 8. System Analysis
The system boundary separates external log shippers from the internal Next.js application layer. Relational integrity is enforced to link alert triggers back to their causing security events, and audit logs are maintained as append-only records.

---

## 9. System Design
System designs are outlined in detail inside [`System_Design.md`](file:///c:/Users/User/Desktop/Mini-Siem/System_Design.md) and include:
* **Decoupled Architecture Diagram:** Showing Ingestion, Application, and Presentation Layers.
* **UML Use Case Diagram:** Showing role-restricted user goals.
* **Entity Relationship Diagram (ERD):** Showing database relations.
* **UML Sequence Diagram:** Outlining logging-to-alerting transaction flows.
* **Dashboard Wireframe:** Presenting the user interface layout.

---

## 10. Implementation
Implemented using Next.js (TypeScript), Prisma ORM, and PostgreSQL/SQLite database models. Key security controls include password encryption, schema validation in API endpoints, and a custom SHA-256 hash chaining system where each event block references the previous block's hash, preventing silent record deletion or tampering.

---

## 11. Testing Summary
Tests were run via automated script [`test-verification.js`](file:///c:/Users/User/Desktop/Mini-Siem/test-verification.js) alongside manual UI verification. 100% of defined integration test cases passed successfully. Full testing criteria, expected outputs, and UI progress screenshots are located in [`Testing_Report.md`](file:///c:/Users/User/Desktop/Mini-Siem/Testing_Report.md).

---

## 12. Technical Debt Summary
Time constraints during the 48-hour development window led to design choices such as using a database polling loop for detection rules instead of real-time stream queues, and deferring Multi-Factor Authentication (MFA). Each item is prioritized with a mitigation roadmap in [`Technical_Debt_Plan.md`](file:///c:/Users/User/Desktop/Mini-Siem/Technical_Debt_Plan.md).

---

## 13. Deployment
The application is configured to build and deploy to **Render** using Next.js static and dynamic route handlers (configuration is detailed in `render.yaml`).
* **Source Repository:** [https://github.com/Kuagbe123/Mini-Siem](https://github.com/Kuagbe123/Mini-Siem)
* **Live Deployment URL:** [Insert Live URL here]

---

## 14. User Manual Summary
Step-by-step setup guides, configuration steps, default credentials, API usage requests, rule creations, and alert triages are documented in the [`User_Manual.md`](file:///c:/Users/User/Desktop/Mini-Siem/User_Manual.md).

---

## 15. Maintenance Strategy
Lifecycle updates, correctness bugs, system modifications, environment adaptations, and backups are managed under a structured policy outlined in [`Maintenance_and_Future_Evolution.md`](file:///c:/Users/User/Desktop/Mini-Siem/Maintenance_and_Future_Evolution.md).

---

## 16. Future Evolution
Planned system upgrades include moving from database polling to BullMQ job queues, integrating a ClickHouse columnar database for processing millions of logs, and adding push notifications (Slack/webhooks) for high-severity alerts.

---

## 17. Limitations
* **Scale:** PostgreSQL database searches slows down under high throughput, requiring full-text engines.
* **Alert Latency:** Event correlation runs on a 15-second timer queue rather than processing logs in real-time.
* **Audit Trail Expiry:** There is currently no automated log rotation or cold archival storage configured.

---

## 18. Conclusion
The Mini-SIEM platform demonstrates how standard software engineering principles (requirements analysis, UCP estimation, system architecture, database modeling, integration testing, and technical debt management) can be successfully applied to build a secure, functional capstone system within a tight timeline.

---

## 19. References
* **ISO/IEC/IEEE 29148:2018:** Systems and software engineering — Requirements engineering.
* **ISO/IEC 14764:2006:** Software engineering — Software life cycle processes — Maintenance.
* **Prisma & Next.js Documentation:** API, ORM, and deployment patterns.
