# Mini-SIEM Platform User Manual
## Installation, Setup, and Operational Guide

**Document ID:** MANUAL-MSIEM-001  
**Version:** 1.0  
**Prepared For:** CSCD602: Advanced Software Engineering — Individual Project-Based Examination  
**Prepared By:** Edward Kuagbenu — 22427388  
**Date:** 15-08-2026  

---

## 1. System Overview

The **Mini Security Information and Event Management (Mini-SIEM)** platform is a lightweight web application designed for centralizing security events, applying detection rules to trigger alerts, and managing analyst investigation workflows. It includes:
* An **Event Ingestion Engine** (under `/api/events`) validating JSON payloads using cryptographic SHA-256 integrity chaining.
* A **Detection Rule Manager** triggering alerts dynamically when event counts cross specified thresholds.
* A **Frosted-Glass Dark-Mode Dashboard** visualizing active alerts, metrics, event streams, and audit trails.
* An **Apple-Inspired Login Panel** featuring a rotating cyber-auditing visual HUD, custom outline SVGs, and interactive password visibility toggles.

---

## 2. Installation and Quickstart

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** or **yarn**
* **Git**
* A local database or SQLite (configured by default)

### Setup Steps
1. **Clone/Unpack the Repository:**
   ```bash
   cd StudentID_ProjectName
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Environment Setup:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-super-secret-random-key"
   ```
4. **Initialize Database Schema (Prisma):**
   ```bash
   npx prisma db push
   ```
5. **Seed Default Users and Data:**
   ```bash
   npx prisma db seed
   ```
6. **Start the Development Server:**
   ```bash
   npm run dev
   ```
7. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 3. User Accounts and Credentials

The database seeding initializes three default human roles and one event source credential:

* **Administrator Account** (Full system configuration and rule editing):
  - **Username:** `admin`
  - **Password:** `AdminPassword123!`
* **Security Analyst Account** (Event querying and alert triaging):
  - **Username:** `analyst`
  - **Password:** `AnalystPassword123!`
* **Auditor Account** (Read-only view of dashboard and audit trails):
  - **Username:** `auditor`
  - **Password:** `AuditorPassword123!`

---

## 4. Operational Instructions

### 4.1. Logging In (with Password Reveal)
1. Navigate to the login page (`http://localhost:3000/login`).
2. Input the target username (e.g. `admin`).
3. Enter the password. The characters are hidden by default as masked dots.
4. To verify characters, click the **Eye Icon** on the right side of the password field. The text will instantly reveal. Click the icon again to re-mask.
5. Click **Sign In** to access the dashboard.

### 4.2. Ingesting Security Events (API)
Event sources submit events via `POST /api/events`.
* **Headers:**
  - `Authorization: Bearer <Source_Token>`
  - `Content-Type: application/json`
* **Request Body Payload (JSON):**
  ```json
  {
    "timestamp": "2026-08-14T12:00:00Z",
    "eventType": "auth.failed",
    "severity": "HIGH",
    "payload": {
      "username": "target_user",
      "sourceIp": "192.168.1.50"
    }
  }
  ```
To register a new source and obtain a Token: Go to the **Settings** panel, click **Add Event Source**, input a name (e.g. `Firewall-Gate`), and copy the generated token.

### 4.3. Creating Detection Rules
1. Navigate to **Settings** -> **Detection Rules**.
2. Click **Create New Rule**.
3. Input:
   - **Rule Name:** e.g. `Brute Force Attempt`
   - **Event Type:** `auth.failed`
   - **Threshold:** `5` (trigger if matches count)
   - **Time Window:** `60` seconds
   - **Severity:** `CRITICAL`
4. Save and enable the rule.

### 4.4. Triaging Alerts
1. Navigate to the **Alerts** tab.
2. View active alerts listed by severity.
3. Click on an alert to view its details (associated raw events and timestamps).
4. Change status (from `NEW` to `UNDER_INVESTIGATION` or `RESOLVED`). Add notes (e.g., "Confirmed false positive, source IP is local admin") to record in the audit trail.
