# FacilityH2O System Security Policy

**System:** FacilityH2O — FacilityH2O Inc. Water Chemistry Tracking Portal
**Owner:** Antoine Riley / FacilityH2O
**Effective Date:** April 1, 2026
**Last Updated:** April 2, 2026

---

## 1. Purpose

This System Security Policy defines the security requirements and controls for FacilityH2O, the internal water chemistry tracking portal operated by Antoine Riley on behalf of FacilityH2O for FacilityH2O Inc.. The goal of this policy is to protect the confidentiality, integrity, and availability of system data while supporting compliance with applicable regulatory standards.

This policy applies to all individuals who access, operate, administer, or support FacilityH2O.

---

## 2. Authentication Requirements

### 2.1 Individual Accounts Mandatory

Every user must have their own individual FacilityH2O account. **Shared accounts are strictly prohibited**, including:
- Shared logins between hospital facilities
- Department-level shared accounts
- "Generic" or role-based accounts used by multiple people
- Contractor accounts shared with other workers

Each account must be associated with a specific named individual who is accountable for all activity under that account.

### 2.2 Account Provisioning

New accounts are provisioned only by the system administrator (Antoine Riley) or a designated facility administrator with provisioning rights. Account creation requires:
- Verified employment status with FacilityH2O or FacilityH2O Inc.
- Assignment to specific facilities (cannot be granted access to all facilities by default)
- Acknowledgment of the Acceptable Use Policy

### 2.3 Account Deprovisioning

User accounts must be deactivated within **24 hours** of:
- Termination of employment or contractor relationship
- Transfer to a role that no longer requires FacilityH2O access
- Extended leave of absence (>30 days)
- Written request from FacilityH2O HR or facility management

Facility administrators must notify the system administrator promptly when these events occur.

### 2.4 Multi-Factor Authentication (MFA)

MFA is required for:
- System administrator access (always)
- Remote access outside of FacilityH2O Inc./FacilityH2O network
- Any account with administrative or export privileges

MFA is recommended but not currently mandated for all standard facility users. Expansion of mandatory MFA to all users is planned for Q3 2026.

---

## 3. Password Policy

All FacilityH2O passwords must meet the following requirements:

| Requirement | Standard |
|-------------|---------|
| Minimum length | 12 characters |
| Complexity | Must include uppercase, lowercase, number, and symbol |
| Expiration | Every 180 days |
| History | Cannot reuse last 5 passwords |
| Failed login lockout | Account locked after 5 consecutive failed attempts |
| Lockout duration | 15 minutes auto-unlock; or manual unlock by administrator |

### 3.1 Password Storage

All passwords are stored as cryptographic hashes (bcrypt with salt). Plaintext passwords are never stored, logged, or transmitted.

### 3.2 Password Resets

Password resets are performed via email verification link sent to the user's registered work email. System administrator can force a password reset at any time. Users must never share passwords when requesting help — administrators do not need your password to assist you.

---

## 4. Role-Based Access Control (RBAC)

FacilityH2O implements a role-based access control model. Access is determined by role assignment, not individual permission grants.

### 4.1 Roles

| Role | Permissions |
|------|-------------|
| **System Administrator** | Full system access: all facilities, all users, all logs, system configuration, user management, data export, backup access |
| **Facility Administrator** | Full access to their assigned facility: user management for that facility, all readings, reports, and exports for that facility only |
| **Facility Staff** | Create and edit chemistry readings for assigned facility; view reports; receive alerts |
| **Read-Only** | View chemistry readings and reports for assigned facility; cannot create or edit records |

### 4.2 Principle of Least Privilege

Users are granted the minimum level of access necessary to perform their job functions. Role elevation (e.g., from Facility Staff to Facility Administrator) requires explicit approval from the system administrator and documented business justification.

### 4.3 Access Reviews

User access is reviewed quarterly by the system administrator to:
- Remove accounts for departed personnel
- Verify role assignments are still appropriate
- Identify dormant accounts (no login in 90 days) for deactivation

---

## 5. Data Isolation Between Facilities

FacilityH2O Inc. comprises 9 hospital facilities. FacilityH2O enforces strict data isolation between facilities:

### 5.1 Technical Isolation

- Every chemistry reading, alert, and corrective action record is tagged to a specific facility
- Access control queries enforce facility-level filtering at the database query level — not just the UI level
- Users cannot access or query data outside their assigned facilities, regardless of URL manipulation or API access

### 5.2 Administrative Isolation

- Facility administrators manage only their own facility's users and data
- No facility administrator has visibility into another facility's data, user list, or compliance history

### 5.3 Audit Trail

All cross-facility access attempts (which should never succeed by design) are logged as security events and reviewed by the system administrator.

---

## 6. Transport Security

### 6.1 HTTPS Required

All access to FacilityH2O must be via HTTPS. The system:
- Enforces HTTPS-only connections (HTTP requests are automatically redirected to HTTPS)
- Uses TLS 1.2 or higher
- Is configured with a valid SSL/TLS certificate maintained by the hosting provider
- Does not support legacy TLS 1.0 or 1.1

### 6.2 API Security

Any API access (admin use only) must use HTTPS and authenticate with a time-limited API token. API tokens are rotated at least every 90 days.

### 6.3 Cookie Security

Session cookies are configured with:
- `Secure` flag (HTTPS only)
- `HttpOnly` flag (not accessible via JavaScript)
- `SameSite=Strict` to prevent cross-site request forgery

---

## 7. Audit Logging

### 7.1 What Is Logged

FacilityH2O maintains comprehensive audit logs that capture:

| Event Type | Details Logged |
|-----------|---------------|
| Login/Logout | Timestamp, user ID, IP address, success/failure |
| Failed login attempts | Timestamp, username attempted, IP address |
| Record creation | Timestamp, user ID, facility, record type and ID |
| Record modification | Timestamp, user ID, previous value, new value |
| Record deletion | Timestamp, user ID, record type and ID, reason if provided |
| Data export / download | Timestamp, user ID, facility, export scope |
| Account creation / deactivation | Timestamp, acting admin, target account |
| Role changes | Timestamp, acting admin, target user, old role, new role |
| Password resets | Timestamp, method, user ID |
| System configuration changes | Timestamp, admin user, change description |

### 7.2 Log Integrity

Audit logs are written to a separate, append-only log store. No user (including Facility Administrators) can delete or modify audit logs. Only the system administrator has read access to raw audit logs, and all log reads are themselves logged.

### 7.3 Log Retention

Audit logs are retained for a minimum of **12 months** (see Data Retention Policy).

### 7.4 Log Review

The system administrator reviews audit logs:
- **Daily:** Automated alerts for suspicious patterns (multiple failed logins, off-hours access, bulk exports)
- **Weekly:** Summary review of access patterns and anomalies
- **Monthly:** Full audit review for dormant accounts and privilege usage

---

## 8. Incident Response

### 8.1 Definition

A security incident is any event that threatens the confidentiality, integrity, or availability of FacilityH2O or its data, including but not limited to:
- Unauthorized access to the system or data
- Credential compromise or account takeover
- Data exfiltration or unauthorized export
- System breach or intrusion
- Ransomware or malware affecting the platform
- Accidental or intentional deletion of compliance records

### 8.2 Reporting

All suspected security incidents must be reported **immediately** to:
- **Antoine Riley** — System Administrator — antoine.riley@facilityh2o.com
- **FacilityH2O IT Security** (escalation as appropriate)

Do not attempt to investigate or remediate independently. Preserve evidence.

### 8.3 Response Process

Upon confirmation of a security incident:

1. **Contain (0–4 hours):** Isolate affected accounts/systems; revoke compromised credentials; suspend suspicious accounts
2. **Assess (4–24 hours):** Determine scope of data affected; identify affected facilities and users; preserve audit logs
3. **Notify (24–72 hours):** Notify FacilityH2O management; notify FacilityH2O Inc. leadership if facility data was affected; notify impacted users
4. **Remediate:** Address root cause; patch vulnerabilities; reset affected credentials; restore from clean backup if necessary
5. **Document:** Prepare incident report within 5 business days; include timeline, data affected, remediation steps, and preventive measures
6. **Review:** Post-incident review within 10 business days; update security controls as needed

### 8.4 External Reporting

If the incident involves unauthorized access to data that may constitute a breach reportable under applicable law or FacilityH2O Inc. policy, the system administrator will work with FacilityH2O legal counsel and FacilityH2O Inc. compliance to assess notification obligations.

---

## 9. Infrastructure Security

### 9.1 Hosting

FacilityH2O is hosted on **Render** (hosting) and **Supabase** (database). These providers maintain:
- SOC 2 Type II compliance
- Physical data center security
- Network-level DDoS protection
- Automated vulnerability patching for infrastructure

### 9.2 Dependency Management

- Application dependencies are reviewed and updated at minimum monthly
- Critical security patches are applied within 72 hours of release
- Dependency vulnerability scans are performed before each deployment

### 9.3 Penetration Testing

Annual security assessment is planned for FacilityH2O infrastructure. Results are reviewed by the system administrator and critical findings remediated within 30 days.

---

## 10. Physical Security

FacilityH2O is a cloud application — no on-premises servers. Physical security is managed by:
- **Render:** Certified data centers with physical access controls
- **Supabase:** Certified cloud database infrastructure

User workstations accessing FacilityH2O are the responsibility of FacilityH2O Inc. and FacilityH2O per their own device and workstation security policies.

---

## 11. Policy Compliance and Enforcement

Compliance with this policy is mandatory for all FacilityH2O users. Violations may result in:
- Immediate account suspension
- Escalation to FacilityH2O HR and FacilityH2O Inc. leadership
- Disciplinary action up to and including termination

The system administrator reviews and updates this policy annually or when significant changes occur.

**Current Version:** 1.0
**Next Review:** April 2027

---

**System Administrator Contact:**
Antoine Riley | antoine.riley@facilityh2o.com
FacilityH2O Portal: https://facilityh2o.com

---

*Internal Use Only — FacilityH2O / FacilityH2O Inc.*
*© 2026 Antoine Riley. All rights reserved.*
