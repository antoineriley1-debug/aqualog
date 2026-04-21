# MedStar H2O — Database Schema

## New Tables/Files for Pricing & Billing

### 1. `accounts.json` — Customer Account Records
Stores subscription account information.

```json
{
  "id": "acc_abc123def456",
  "tier": "pro",
  "status": "active",
  "companyName": "MedStar Washington",
  "contactName": "Jane Doe",
  "email": "jane@medstar.org",
  "phone": "(202) 555-0123",
  
  // Payment info (encrypted in production)
  "paymentStatus": "active",
  "lastFourCard": "4242",
  
  // Hospital assignment
  "hospitalId": "hos_xyz789",
  
  // Operator count
  "operatorCount": 3,
  
  // For custom tier inquiries
  "hospitalsNeeded": 25,
  "inquiryNotes": "Need SSO and custom parameters",
  
  // Timestamps
  "createdAt": "2026-04-20T20:42:00Z",
  "updatedAt": "2026-04-20T20:42:00Z"
}
```

**Fields:**
- `id` — Unique account ID (prefix: `acc_`)
- `tier` — Subscription tier: `starter` | `pro` | `custom`
- `status` — Account status: `pending` | `active` | `suspended` | `cancelled`
- `companyName` — Hospital/organization name
- `contactName` — Primary contact person
- `email` — Contact email
- `phone` — Contact phone
- `paymentStatus` — For paid tiers: `pending` | `active` | `failed`
- `lastFourCard` — Last 4 digits of payment method
- `hospitalId` — Primary hospital (created after setup)
- `operatorCount` — Number of operators created
- `createdAt` — Account creation timestamp
- `updatedAt` — Last update timestamp

---

### 2. `hospitals.json` — Enhanced Hospital Records
Added fields to support tier limits and account association.

```json
{
  "id": "hos_abc123def456",
  "accountId": "acc_abc123def456",
  "tier": "pro",
  "name": "Washington Hospital Center",
  "address": "110 Irving Street NW",
  "city": "Washington",
  "state": "DC",
  "zipCode": "20010",
  "phone": "(202) 877-3100",
  
  // Tier limits
  "maxHospitals": 10,
  "operatorCount": 3,
  
  // Status
  "active": true,
  
  // Timestamps
  "createdAt": "2026-04-20T20:42:00Z",
  "updatedAt": "2026-04-20T20:42:00Z"
}
```

**New fields:**
- `accountId` — Links hospital to customer account
- `tier` — Customer's subscription tier (for local enforcement)
- `maxHospitals` — Max hospitals allowed for this tier (enforced in API)
- `operatorCount` — Number of operators for this hospital

---

### 3. `users.json` — Enhanced User Records
Added fields to link operators to accounts and hospitals.

```json
{
  "id": "usr_abc123def456",
  "accountId": "acc_abc123def456",
  "hospitalId": "hos_abc123def456",
  "username": "operator@hospital.com",
  "email": "operator@hospital.com",
  "name": "John Smith",
  "password": "...", // Hashed in production
  "role": "operator",
  "active": true,
  "createdAt": "2026-04-20T20:42:00Z",
  "updatedAt": "2026-04-20T20:42:00Z"
}
```

**New fields:**
- `accountId` — Links operator to customer account
- `hospitalId` — Hospital the operator is assigned to

---

### 4. `tiers.json` — Pricing Tier Configuration
Admin-managed pricing tiers.

```json
[
  {
    "id": "starter",
    "name": "Starter",
    "price": 499,
    "hospitalLimit": 1,
    "accountLimit": "unlimited",
    "description": "Perfect for small facilities",
    "enabled": true,
    "order": 1,
    "updatedAt": "2026-04-20T20:42:00Z"
  },
  {
    "id": "pro",
    "name": "Pro",
    "price": 999,
    "hospitalLimit": 10,
    "accountLimit": "unlimited",
    "description": "Scaled for multi-hospital networks",
    "enabled": true,
    "order": 2,
    "updatedAt": "2026-04-20T20:42:00Z"
  },
  {
    "id": "custom",
    "name": "Custom",
    "price": null,
    "hospitalLimit": "unlimited",
    "accountLimit": "unlimited",
    "description": "Enterprise-grade solutions",
    "enabled": true,
    "order": 3,
    "updatedAt": "2026-04-20T20:42:00Z"
  }
]
```

**Fields:**
- `id` — Tier identifier
- `name` — Display name
- `price` — Monthly price (null for custom)
- `hospitalLimit` — Max hospitals for this tier
- `accountLimit` — Max accounts (always unlimited)
- `description` — Marketing description
- `enabled` — Visible on pricing page?
- `order` — Display order
- `updatedAt` — Last admin update

---

### 5. Enhanced `audit.json`
Added new event types for billing/account lifecycle.

```json
{
  "id": "aud_abc12345",
  "type": "account",
  "action": "setup_complete",
  "accountId": "acc_abc123def456",
  "hospitalId": "hos_abc123def456",
  "detail": "Account activated: Washington Hospital Center",
  "outcome": "SUCCESS",
  "createdAt": "2026-04-20T20:42:00Z"
}
```

**New audit event types:**
- `type: "account"` with actions:
  - `checkout_initiated` — Checkout process started
  - `checkout_completed` — Payment processed or inquiry submitted
  - `setup_complete` — Hospital + operators created, account activated
  - `tier_changed` — Subscription upgraded/downgraded
  - `payment_failed` — Payment failed, account suspended
  - `account_cancelled` — Account cancelled

---

## Tier Limits Enforcement

### Rules

1. **Starter Tier**
   - Max 1 hospital per account
   - Unlimited operator accounts
   - Cannot add 2nd hospital until upgraded

2. **Pro Tier**
   - Max 10 hospitals per account
   - Unlimited operator accounts
   - Can add up to 10 hospitals

3. **Custom Tier**
   - Unlimited hospitals
   - Unlimited operator accounts
   - No soft limits

### Enforcement Points

- **Pricing Page** — Shows tier limits clearly
- **Checkout** — Pre-payment, communicates limits
- **Setup** — Creates first hospital within limit
- **Admin Panel** — Cannot create 11th hospital on Pro plan
- **API** — `POST /api/hospitals` validates: `if (hospitalCount >= tierLimit) reject`

---

## Migration Notes

### For Existing Installations

1. Run migration script to add `accountId` and `tier` to existing hospitals
2. Create default account for each existing organization
3. Link operators to their hospitals via `hospitalId`
4. Initialize `tiers.json` with default pricing

### Path Forward

- **Phase 1 (Now)**: File-based JSON storage
- **Phase 2 (Soon)**: Migrate to PostgreSQL/Supabase
- **Phase 3 (Later)**: Add Stripe integration for payments

---

## API Endpoints Reference

### Pricing & Checkout
- `GET /app/pricing` — Public pricing page
- `POST /api/checkout` — Process payment/inquiry
- `POST /api/setup/complete` — Activate account after checkout

### Admin
- `GET /api/admin/tiers` — List all tiers
- `PATCH /api/admin/tiers` — Enable/disable/update tier
- `GET /settings/tiers` — Admin UI for tier management

### Accounts
- `GET /api/accounts?accountId=xxx` — Get account by ID
- `POST /api/accounts/validate-tier-limit` — Check if can add hospital
- `GET /api/accounts?email=xxx` — Get account by email (admin)

---

## Testing Checklist

- [ ] Pricing page displays all tiers
- [ ] Get Started buttons route to checkout with correct tier
- [ ] Checkout form validates required fields
- [ ] Custom tier shows contact form instead of payment
- [ ] Starter/Pro show payment form (demo)
- [ ] Setup page creates hospital + operators
- [ ] Hospital created with tier limits enforced
- [ ] Admin can enable/disable tiers
- [ ] Admin can update prices
- [ ] Tier changes take effect immediately
- [ ] Disabled tiers hidden from pricing page
- [ ] Account activation works end-to-end
- [ ] Tier limit validation on hospital creation
