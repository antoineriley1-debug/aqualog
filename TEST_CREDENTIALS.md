# FacilityH2O Test Credentials

## Admin Account
- **Username:** `ariley`
- **Password:** `51351853`
- **Role:** Admin (Enterprise tier)
- **Access:** All features including ST108, Legionella, Reports, Settings

---

## Operator Accounts (Test Different Tiers)

### Professional Tier (Can access ST108 & Legionella)

| Hospital | Username | Password | Hospital ID | Tier |
|----------|----------|----------|-------------|------|
| Washington Hospital Center | `op_whc` | `WHC2026!` | whc | Professional |
| Harbor Hospital | `op_harbor` | `Harbor2026!` | harbor | Professional |
| Georgetown | `op_geo` | `Geo2026!` | geo | Professional |
| Franklin Square | `op_frank` | `Frank2026!` | frank | Professional |
| Union Memorial | `op_union` | `Union2026!` | union | Professional |
| National Rehab | `op_nrh` | `NRH2026!` | nrh | Professional |

### Starter Tier (ST108 & Legionella BLOCKED)

| Hospital | Username | Password | Hospital ID | Tier |
|----------|----------|----------|-------------|------|
| Southern Maryland | `op_somd` | `SoMD2026!` | somd | Starter |
| Montgomery | `op_mont` | `Mont2026!` | mont | Starter |
| Good Samaritan | `op_gs` | `GS2026!` | gs | Starter |
| St. Mary's | `op_stm` | `StM2026!` | stm | Starter |

---

## How to Test Tier Gating

### ✅ Professional Tier Access (op_whc)
1. Sign in with `op_whc` / `WHC2026!`
2. Click "AAMI ST108 Water Quality Log" (sidebar)
3. **Expected:** Entry form appears
4. Click "Legionella / WMP" (sidebar)
5. **Expected:** Form appears

### ❌ Starter Tier Block (op_somd)
1. Sign in with `op_somd` / `SoMD2026!`
2. Click "AAMI ST108 Water Quality Log" (sidebar)
3. **Expected:** Premium feature screen with "Upgrade Plan" button
4. Click "Legionella / WMP" (sidebar)
5. **Expected:** Same premium feature screen

### ✅ Hospital Locking (Entry Page)
1. Sign in with any operator account
2. Go to "➕ New Entry" (sidebar)
3. **Expected:** Hospital field is pre-filled & disabled (locked to their hospital)
4. Can only add entries for their assigned hospital

---

## Hospital Images

All 10 hospitals now have placeholder images at:
- `public/hospitals/{id}.jpg`

Images automatically load when displaying hospital details.

---

## Pricing Page

Visit `/pricing` to verify:
- **Starter:** $349/month
- **Professional:** $599/month
- **Enterprise:** Custom pricing

---

## What Was Added (4/20/2026)

1. ✅ **Hospital Images** - All 10 hospitals have placeholder JPEGs in `/public/hospitals/`
2. ✅ **Operator Sign-in** - Works with locked hospital assignment (op_whc / WHC2026!)
3. ✅ **Tier-Based Access Control** - ST108 & Legionella require Professional tier
4. ✅ **Pricing Page** - Correct tiers & pricing displayed

---

## Files Modified

- `components/TierGate.js` - New gating component
- `app/st108/page.js` - Added tier check
- `app/legionella/page.js` - Added tier check
- `data/users.json` - Added `tier` field to all users
- `public/hospitals/*.jpg` - 10 new hospital images

**Commit:** `df69a918` (pushed to origin + aqualog)
