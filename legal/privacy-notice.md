# FacilityH2O Privacy Notice

**System:** FacilityH2O — FacilityH2O Inc. Water Chemistry Tracking Portal
**Owner:** Antoine Riley / FacilityH2O
**Effective Date:** April 1, 2026
**Last Updated:** April 2, 2026

---

## 1. Overview

This Privacy Notice describes how FacilityH2O collects, uses, and protects information about individuals who use the system. FacilityH2O is an **internal system** operated by Antoine Riley on behalf of FacilityH2O for use within the FacilityH2O Inc. hospital system.

**FacilityH2O is not a public-facing product.** It is not subject to consumer-facing privacy regulations such as the California Consumer Privacy Act (CCPA), the EU General Data Protection Regulation (GDPR), or similar statutes in their commercial application. However, as a matter of professional responsibility and good practice, FacilityH2O and the system administrator maintain the following privacy commitments.

**FacilityH2O is not a clinical system.** It does not process Protected Health Information (PHI) as defined by HIPAA. All data relates to building infrastructure and water chemistry — not patient data.

---

## 2. Who This Notice Applies To

This notice applies to:
- All current and former FacilityH2O users (FacilityH2O and FacilityH2O Inc. employees and contractors)
- Individuals whose information is recorded in the system as part of account management or activity logging

---

## 3. Information Logged by FacilityH2O

### 3.1 User Account Information
When a user account is created, FacilityH2O records:
- Full name
- Work email address
- Job title / role
- Assigned facility or facilities
- Account creation date
- Password (stored as a cryptographic hash — never plaintext)

### 3.2 Chemistry Reading Records
When users log water chemistry tests, the system records:
- The water chemistry data entered (pH, chlorine, temperature, etc.)
- The facility and test location associated with the reading
- The **username of the individual who entered the reading**
- Timestamp of entry

User attribution of readings is required for compliance documentation and audit trail purposes.

### 3.3 Login and Activity Logs
FacilityH2O logs the following for all user sessions:
- Date and time of login and logout
- IP address from which the login originated
- Browser type and operating system
- Pages and features accessed during the session
- Records created, modified, or deleted (with timestamp and user ID)
- Export and download actions

### 3.4 Alert and Notification Records
When alerts are generated and sent:
- The user(s) notified
- The alert content and triggering reading
- Timestamp of alert generation and acknowledgment

### 3.5 What Is NOT Logged
FacilityH2O does **not** log or store:
- Patient names, identifiers, or health information
- Personal financial information
- Social Security Numbers or government ID numbers
- Personal device information for non-FacilityH2O devices

---

## 4. How Information Is Used

Information logged by FacilityH2O is used exclusively for:

- **Operational delivery:** Processing and displaying chemistry readings, reports, and dashboards.
- **Compliance documentation:** Providing auditable records of water management program activities for ASHRAE 188, The Joint Commission, and CMS requirements.
- **Security and audit trail:** Maintaining a record of who accessed and modified data to support investigations and compliance reviews.
- **System administration:** Account management, password resets, access control changes.
- **Alerting:** Delivering automated notifications of out-of-range readings to assigned staff.
- **Performance monitoring:** Diagnosing system errors and maintaining uptime.

Information is **not** used for:
- Marketing or advertising
- Sale to third parties
- Research purposes
- Any purpose outside of water chemistry compliance management

---

## 5. Who Can Access Your Information

Access to information in FacilityH2O is restricted on a need-to-know basis:

| Role | Access Level |
|------|-------------|
| **System Administrator (Antoine Riley)** | Full access to all data across all facilities, all logs, all user records |
| **FacilityH2O Management** | Access to aggregate compliance data and reports; user management for their facilities |
| **Facility-Level Users** | Access to data for their assigned facility only; cannot see other facilities' data or other users' accounts |
| **FacilityH2O Inc. Leadership** | Read-only access to compliance reports for their hospitals (upon request) |

**No external sharing:** FacilityH2O data is not shared with third parties except:
- Hosting provider (Render) and database provider (Supabase) — who process data on our behalf under service agreements and have no right to use data for their own purposes
- Law enforcement or regulatory bodies if required by valid legal process

---

## 6. Data Retention

Refer to the **FacilityH2O Data Retention Policy** for full detail. In summary:
- Chemistry readings: retained minimum 24 months
- User accounts: retained for duration of employment plus 12 months post-deactivation
- Activity logs: retained minimum 12 months
- Backups: rolling 90-day retention

---

## 7. Security Measures

FacilityH2O protects your information through:

- **Encryption in transit:** All communication between users and the FacilityH2O servers uses TLS 1.2+ encryption.
- **Encryption at rest:** All data stored in the database is encrypted using AES-256.
- **Access controls:** Role-based access ensures users can only see their assigned facility's data.
- **Authentication:** Individual accounts with password hashing; no shared credentials.
- **Monitoring:** Activity logs are reviewed for anomalous behavior.
- **Hosting security:** Render and Supabase maintain SOC 2-aligned infrastructure security.

---

## 8. Your Information Rights (Internal)

Although FacilityH2O is an internal system, FacilityH2O and the system administrator will honor reasonable requests from users regarding their personal information:

- **Access:** You may request a summary of your account information and activity logs by contacting the system administrator.
- **Correction:** If your account information is incorrect (name, title, email), contact the system administrator for correction.
- **Deactivation:** Upon separation from FacilityH2O or FacilityH2O Inc., your account will be deactivated within 24 hours of notification. Activity records and chemistry entries you made are retained per the Data Retention Policy.

**Requests:** Contact Antoine Riley at antoine.riley@facilityh2o.com

---

## 9. Consent and Acknowledgment

By using FacilityH2O, all users acknowledge that:
- Their activity within the system is logged and monitored
- Their name and employee information is associated with records they enter
- This Privacy Notice governs how their information is handled

This notice is provided in conjunction with the FacilityH2O Acceptable Use Policy, which users must acknowledge upon first login.

---

## 10. Changes to This Notice

This Privacy Notice may be updated by the system administrator. Users will be notified of material changes via system announcement or email. The "Last Updated" date at the top of this document reflects the most recent revision.

---

## 11. Contact

For privacy questions, data access requests, or to report concerns:

**System Administrator:**
Antoine Riley
Email: antoine.riley@facilityh2o.com
FacilityH2O Portal: https://facilityh2o.com

---

*Internal Use Only — FacilityH2O / FacilityH2O Inc.*
*© 2026 Antoine Riley. All rights reserved.*
